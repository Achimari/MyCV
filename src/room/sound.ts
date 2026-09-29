import type { Mode } from "../data/site";
import { buildForm, FORM_BARS, type Hit } from "./music";

/**
 * Звук сайта на Web Audio: без библиотек, файлов и чужих записей.
 *
 * Две шины: «музыка» — собственный процедурный джаз (форма из music.ts),
 * и «эффекты» — отклик интерфейса. Обе идут через общий мастер: громкость
 * посетителя → фильтр, срезающий резкие верха → лимитер. Контекст создаётся
 * только после жеста и засыпает, когда оба канала выключены или вкладка скрыта.
 */

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

const BPM = 78;
const EIGHTH = 60 / BPM / 2;
/** Лёгкий свинг: вторая восьмая доли чуть позже середины. */
const SWING = 0.58;
/** Форма одна на всю сессию и не меняется при смене разделов. */
const FORM = buildForm((Date.now() ^ 0x5eed) >>> 0);

/** Ноты ссылок: до мажорная пентатоника, у каждой ссылки своя постоянная. */
const LINK_NOTES = [62, 64, 67, 69, 72].map(midi);

/** Смесь для каждого раздела: барабаны, аккорды, бас, мелодия, яркость. */
const MIX: Record<Mode, { drums: number; comp: number; bass: number; lead: number; cutoff: number }> = {
  home: { drums: 0.7, comp: 1, bass: 1, lead: 0.7, cutoff: 3000 },
  about: { drums: 0.3, comp: 0.9, bass: 0.85, lead: 0.4, cutoff: 1700 },
  schedule: { drums: 1, comp: 0.65, bass: 0.9, lead: 0.2, cutoff: 2300 },
  links: { drums: 0.5, comp: 0.9, bass: 0.75, lead: 0.9, cutoff: 3600 },
};

const MASTER = 0.6;
const MUSIC = 0.34;
const SOFTEN = 4200;
const LOOKAHEAD = 0.3;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let fxBus: GainNode | null = null;
let music: {
  bus: GainNode;
  tone: BiquadFilterNode;
  drums: GainNode;
  comp: GainNode;
  bass: GainNode;
  lead: GainNode;
} | null = null;
let noiseBuffer: AudioBuffer | null = null;

let musicOn = false;
let fxOn = false;
let gestured = false;
let volume = 0.8;
let mode: Mode = "home";

let scheduler = 0;
let nextTime = 0;
let step = 0;
let suspendTimer = 0;
const lastNote = new Map<string, number>();

function init(): boolean {
  if (ctx) return true;
  try {
    const AC =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER * volume;
    const soften = ctx.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = SOFTEN;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    master.connect(soften).connect(limiter).connect(ctx.destination);

    fxBus = ctx.createGain();
    fxBus.gain.value = 0;
    fxBus.connect(master);

    const bus = ctx.createGain();
    bus.gain.value = 0;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    bus.connect(tone).connect(master);
    const sub = () => {
      const g = ctx!.createGain();
      g.connect(bus);
      return g;
    };
    music = { bus, tone, drums: sub(), comp: sub(), bass: sub(), lead: sub() };

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    document.addEventListener("visibilitychange", onVisibility);
    applyMix(0.01);
    return true;
  } catch {
    ctx = null;
    return false;
  }
}

async function wake(): Promise<boolean> {
  gestured = true;
  window.clearTimeout(suspendTimer);
  if (!init() || !ctx) return false;
  try {
    await ctx.resume();
    return ctx.state === "running";
  } catch {
    return false;
  }
}

/** Когда оба канала выключены — контекст засыпает и не тратит процессор. */
function maybeSleep() {
  window.clearTimeout(suspendTimer);
  if (musicOn || fxOn) return;
  suspendTimer = window.setTimeout(() => void ctx?.suspend().catch(() => undefined), 500);
}

function applyMix(fade = 0.15) {
  if (!ctx || !music) return;
  const m = MIX[mode];
  const t = ctx.currentTime;
  music.drums.gain.setTargetAtTime(m.drums, t, fade);
  music.comp.gain.setTargetAtTime(m.comp, t, fade);
  music.bass.gain.setTargetAtTime(m.bass, t, fade);
  music.lead.gain.setTargetAtTime(m.lead, t, fade);
  music.tone.frequency.setTargetAtTime(m.cutoff, t, fade);
}

// ---- голоса -----------------------------------------------------------------

type VoiceOpts = { type?: OscillatorType; to?: number; pan?: number; partial?: number };

/** Тон с огибающей; все узлы отключаются после окончания. */
function note(out: AudioNode, freq: number, at: number, peak: number, attack: number, decay: number, opts: VoiceOpts = {}) {
  if (!ctx) return;
  try {
    const c = ctx;
    const gain = c.createGain();
    const end = at + attack + decay + 0.05;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    let tail: AudioNode = gain;
    if (opts.pan && typeof c.createStereoPanner === "function") {
      const panner = c.createStereoPanner();
      panner.pan.value = opts.pan;
      gain.connect(panner);
      tail = panner;
    }
    tail.connect(out);
    const osc = c.createOscillator();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(freq, at);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, end);
    osc.connect(gain);
    const oscs = [osc];
    // Лёгкий второй обертон — «электропиано».
    if (opts.partial) {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(freq * 2, at);
      const g = c.createGain();
      g.gain.value = opts.partial;
      o.connect(g).connect(gain);
      oscs.push(o);
    }
    osc.onended = () => {
      oscs.forEach((o) => o.disconnect());
      gain.disconnect();
      if (tail !== gain) tail.disconnect();
    };
    oscs.forEach((o) => {
      o.start(at);
      o.stop(end);
    });
  } catch {
    /* звук необязателен */
  }
}

function noise(out: AudioNode, at: number, peak: number, decay: number, type: BiquadFilterType, freq: number, pan = 0) {
  if (!ctx || !noiseBuffer) return;
  try {
    const c = ctx;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = 0.7;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    let tail: AudioNode = gain;
    if (pan && typeof c.createStereoPanner === "function") {
      const panner = c.createStereoPanner();
      panner.pan.value = pan;
      gain.connect(panner);
      tail = panner;
    }
    src.connect(f).connect(gain);
    tail.connect(out);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      gain.disconnect();
      if (tail !== gain) tail.disconnect();
    };
    src.start(at, (at * 7.3) % 0.5);
    src.stop(at + decay + 0.05);
  } catch {
    /* звук необязателен */
  }
}

// ---- джаз -------------------------------------------------------------------

const hitsAt = (hits: Hit[], eighth: number) => hits.filter((h) => h.at === eighth);

/** Одна восьмая формы: щётки, бас, аккорды и редкая мелодия. */
function playEighth(at: number, index: number) {
  if (!music) return;
  const bar = FORM[Math.floor(index / 8) % FORM_BARS];
  const eighth = index % 8;
  const offbeat = eighth % 2 === 1;
  const t = at + bar.nudge[eighth] * EIGHTH;

  if (bar.drums > 0) {
    const accent = !offbeat && (eighth === 2 || eighth === 6);
    noise(music.drums, t, (accent ? 0.045 : 0.018) * bar.drums, offbeat ? 0.06 : 0.1, "bandpass", 2400, offbeat ? 0.2 : -0.2);
    if (eighth === 0 || eighth === 4) noise(music.drums, t, 0.028 * bar.drums, 0.05, "lowpass", 140);
  }

  for (const h of hitsAt(bar.bass, eighth)) {
    note(music.bass, midi(h.note), t, 0.15 * h.vel, 0.012, h.len * EIGHTH * 0.9, { type: "triangle" });
  }
  for (const h of hitsAt(bar.comp, eighth)) {
    const long = bar.breakdown;
    bar.chord.voicing.forEach((n, i) =>
      note(music!.comp, midi(n), t + i * 0.01, (long ? 0.028 : 0.032) * h.vel, long ? 0.3 : 0.01, h.len * EIGHTH * (long ? 1 : 0.8), {
        partial: 0.15,
      }),
    );
  }
  for (const h of hitsAt(bar.melody, eighth)) {
    note(music.lead, midi(h.note), t, 0.04 * h.vel, 0.006, h.len * EIGHTH, { partial: 0.25, pan: (h.note % 5) * 0.08 - 0.16 });
  }
}

function schedule() {
  if (!ctx || !musicOn) return;
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    const swing = step % 2 === 1 ? (SWING - 0.5) * 2 * EIGHTH : 0;
    playEighth(nextTime + swing, step);
    nextTime += EIGHTH;
    step++;
  }
  scheduler = window.setTimeout(schedule, 100);
}

/** Запуск с мягким нарастанием; повторный вызов второй петли не создаёт. */
function startMusic() {
  if (!ctx || !music || scheduler) return;
  const t = ctx.currentTime;
  music.bus.gain.cancelScheduledValues(t);
  music.bus.gain.setValueAtTime(music.bus.gain.value, t);
  music.bus.gain.linearRampToValueAtTime(MUSIC, t + 2.5);
  nextTime = t + 0.08;
  schedule();
}

function stopMusic(fade = 0.4) {
  window.clearTimeout(scheduler);
  scheduler = 0;
  if (!ctx || !music) return;
  const t = ctx.currentTime;
  music.bus.gain.cancelScheduledValues(t);
  music.bus.gain.setValueAtTime(music.bus.gain.value, t);
  music.bus.gain.linearRampToValueAtTime(0, t + fade);
}

/** Скрытая вкладка: музыка затихает, контекст засыпает; возвращается, если была включена. */
function onVisibility() {
  if (!ctx) return;
  if (document.hidden) {
    stopMusic(0.2);
    window.setTimeout(() => document.hidden && void ctx?.suspend().catch(() => undefined), 300);
  } else if (gestured && (musicOn || fxOn)) {
    ctx
      .resume()
      .then(() => musicOn && startMusic())
      .catch(() => undefined);
  }
}

// При горячей перезагрузке модуля в разработке — никаких двойных петель.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.clearTimeout(scheduler);
    window.clearTimeout(suspendTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    void ctx?.close().catch(() => undefined);
  });
}

// ---- эффекты интерфейса -------------------------------------------------

function fx(): AudioNode | null {
  return fxOn && ctx && fxBus && ctx.state === "running" ? fxBus : null;
}

/** Не чаще одного раза за interval для данного ключа. */
function throttle(key: string, interval: number) {
  const now = performance.now();
  if (now - (lastNote.get(key) ?? 0) < interval) return false;
  lastNote.set(key, now);
  return true;
}

export const sound = {
  /** Только из обработчика жеста. */
  async setMusic(on: boolean) {
    musicOn = on;
    if (on) {
      if (await wake()) startMusic();
    } else {
      stopMusic();
      maybeSleep();
    }
  },
  /** Только из обработчика жеста. */
  async setEffects(on: boolean) {
    fxOn = on;
    if (on) {
      if ((await wake()) && ctx && fxBus) fxBus.gain.setTargetAtTime(1, ctx.currentTime, 0.02);
    } else {
      if (ctx && fxBus) fxBus.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      maybeSleep();
    }
  },
  /** Общая громкость 0–1; до первого жеста просто запоминается. */
  setVolume(v: number) {
    volume = Math.min(1, Math.max(0, v));
    if (ctx && master) master.gain.setTargetAtTime(MASTER * volume, ctx.currentTime, 0.05);
  },
  setMode(next: Mode) {
    mode = next;
    applyMix();
  },
  /** Открытие сайта и включение эффектов: мягкий аккорд Cmaj9. */
  enter() {
    const out = fx();
    if (!out || !ctx) return;
    const t = ctx.currentTime;
    [48, 55, 59, 62, 64].forEach((n, i) => note(out, midi(n), t + i * 0.05, 0.045, 0.08, 1.5, { partial: 0.12 }));
  },
  /** Смена видео: короткий «щелчок плёнки», чуть сдвинутый в сторону смены. */
  select(dir: 1 | -1 = 1) {
    const out = fx();
    if (!out || !ctx) return;
    const t = ctx.currentTime;
    const pan = dir * 0.3;
    noise(out, t, 0.07, 0.035, "bandpass", 1800, pan);
    noise(out, t + 0.045, 0.04, 0.03, "bandpass", 1200, pan);
    note(out, 95, t, 0.06, 0.003, 0.1, { to: 70, pan });
  },
  /** Клик по портрету: мягкий деревянный стук. */
  portrait() {
    const out = fx();
    if (!out || !ctx) return;
    const t = ctx.currentTime;
    noise(out, t, 0.035, 0.05, "bandpass", 700);
    note(out, 190, t, 0.045, 0.002, 0.07, { to: 120, type: "triangle" });
  },
  /** Переход в раздел: сдержанный тональный щелчок. */
  navigate() {
    const out = fx();
    if (!out || !ctx) return;
    const t = ctx.currentTime;
    note(out, midi(67), t, 0.03, 0.003, 0.09, { partial: 0.1 });
    noise(out, t, 0.02, 0.03, "lowpass", 1200);
  },
  /** Наведение на важную кнопку — один раз при входе, не чаще раза в 80 мс. */
  hover() {
    const out = fx();
    if (!out || !ctx || !throttle("hover", 80)) return;
    note(out, 620, ctx.currentTime, 0.01, 0.004, 0.04, { type: "triangle" });
  },
  /** Ссылка в фокусе: едва слышная своя нота, не чаще раза в 0.4 с. */
  linkFocus(index: number) {
    const out = fx();
    if (!out || !ctx || !throttle("any-link", 90) || !throttle(`link-${index}`, 400)) return;
    note(out, LINK_NOTES[index % LINK_NOTES.length], ctx.currentTime, 0.022, 0.01, 0.3, { partial: 0.2 });
  },
  /** Переход по ссылке соцсети: её нота и квинта — яснее, чем при наведении. */
  linkOpen(index: number) {
    const out = fx();
    if (!out || !ctx) return;
    const f = LINK_NOTES[index % LINK_NOTES.length];
    const t = ctx.currentTime;
    note(out, f, t, 0.045, 0.005, 0.25, { partial: 0.2 });
    note(out, f * 1.5, t + 0.07, 0.035, 0.005, 0.3, { partial: 0.2 });
  },
  /** Любая другая внешняя ссылка. */
  link() {
    const out = fx();
    if (!out || !ctx) return;
    const t = ctx.currentTime;
    note(out, 330, t, 0.035, 0.005, 0.12);
    note(out, 440, t + 0.07, 0.03, 0.005, 0.14);
  },
  play() {
    const out = fx();
    if (!out || !ctx) return;
    const t = ctx.currentTime;
    note(out, 220, t, 0.03, 0.01, 0.12);
    note(out, 330, t + 0.06, 0.025, 0.01, 0.14);
  },
  pause() {
    const out = fx();
    if (!out || !ctx) return;
    const t = ctx.currentTime;
    note(out, 330, t, 0.03, 0.01, 0.12);
    note(out, 220, t + 0.06, 0.025, 0.01, 0.16);
  },
};
