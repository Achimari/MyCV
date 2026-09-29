import type { Mode, SceneId, SubjectSide } from "../data/site";

/**
 * Непрерывная анимация сцены: один requestAnimationFrame, без setState в кадре.
 *
 * Видео — всегда во весь экран, общий фундамент всех разделов. Разделы
 * переставляют только портрет и ореол, и портрет всегда уходит от человека
 * в кадре: к противоположному краю, за край экрана или совсем прячется.
 * Смена видео — только через select(). Курсор слегка сдвигает портрет и зерно; видео стоит.
 */

/** Центр и размер (сторона квадрата) элемента. */
type Spot = { x: number; y: number; s: number };
export type ModeLayout = { portrait: Spot; portraitOpacity: number; halo: Spot; haloOpacity: number };

export interface SceneSubject {
  desktop: SubjectSide;
  mobile: SubjectSide;
}

/** Натуральный размер элемента портрета; на экран он попадает через scale. */
export const PORTRAIT_BASE = 800;
const CHANGE_SECONDS = 0.6;
/** Запас кадра, чтобы короткий сдвиг при смене видео не открывал края. */
const OVERSCAN = 1.02;

/** Телефон или планшет стоя. CSS повторяет это условие в медиазапросе (см. index.css). */
export function isCompact(W: number, H: number) {
  return W <= 760 || (W < 1000 && H >= W);
}

function shown(portrait: Spot, opacity = 1): ModeLayout {
  const { x, y, s } = portrait;
  return {
    portrait,
    portraitOpacity: opacity,
    halo: { x: x + s * 0.015, y: y - s * 0.07, s: s * 0.95 },
    haloOpacity: opacity,
  };
}

/** Раскладка портрета для раздела и того, где в выбранном видео человек. */
function layoutFor(mode: Mode, W: number, H: number, subject: SceneSubject): ModeLayout {
  if (isCompact(W, H)) {
    const home = { x: W * 0.8, y: H * 0.58, s: Math.min(W * 0.56, H * 0.3) };
    // В разделах на телефоне портрета нет: маленькая наклейка оторвана от композиции
    // и мешает человеку в кадре. Связь держат цвет и шрифт.
    return shown(home, mode === "home" ? 1 : 0);
  }

  const side = subject.desktop;
  switch (mode) {
    case "about":
      // Текст у края напротив человека; портрет — в нижнем правом углу,
      // и только если человек в центре (иначе безопасного места нет).
      // Крупный срез у края: четверть портрета уходит за край экрана,
      // низ остаётся над полосой кнопок.
      return shown({ x: W - H * 0.1, y: H * 0.66, s: H * 0.42 }, side === "center" ? 1 : 0);
    case "schedule":
      return shown({ x: H * 0.1, y: H * 0.62, s: H * 0.42 }, side === "center" ? 1 : 0);
    case "links":
      // В ссылках портрета нет: главное — видео.
      return shown({ x: W * 0.82, y: H * 0.56, s: H * 0.4 }, 0);
    default:
      // Главная: крупный портрет у края, противоположного человеку.
      return side === "right"
        ? shown({ x: W * 0.2, y: H * 0.46, s: Math.min(H * 0.6, W * 0.36) })
        : shown({ x: W * 0.82, y: H * 0.6, s: Math.min(H * 0.58, W * 0.38) });
  }
}

export interface EngineRefs {
  stage: HTMLElement;
  layers: HTMLElement[];
  portrait: HTMLElement;
  halo: HTMLElement;
}

export interface EngineEvents {
  /** Видео выбрано свайпом по сцене. */
  onSwipe: (dir: 1 | -1) => void;
  /** Портрет показан или спрятан в этой раскладке (редкое событие). */
  onPortraitVisible: (visible: boolean) => void;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpSpot = (a: Spot, b: Spot, k: number): Spot => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k) });

export function createEngine(
  refs: EngineRefs,
  events: EngineEvents,
  reducedMotion: boolean,
  initial: SceneId,
  subjects: SceneSubject[],
) {
  const { stage, layers, portrait, halo } = refs;
  let W = stage.clientWidth;
  let H = stage.clientHeight;
  let mode: Mode = "home";
  let selected: number = initial;
  let target = layoutFor(mode, W, H, subjects[selected]);
  let layout = structuredClone(target);
  let portraitVisible = target.portraitOpacity > 0;

  const raw = { x: 0.5, y: 0.5 };
  const p = { x: 0.5, y: 0.5 };
  let presence = 0;
  let presenceTarget = 0;

  let previous = -1;
  let direction = 1;
  let changeAt = -10;

  let t = 0;
  let last = performance.now();
  let raf = 0;

  function retarget() {
    target = layoutFor(mode, W, H, subjects[selected]);
    // Спрятанный портрет возвращается сразу на новое место, а не пролетает через экран.
    if (layout.portraitOpacity < 0.05) {
      layout.portrait = { ...target.portrait };
      layout.halo = { ...target.halo };
    }
    const visible = target.portraitOpacity > 0;
    if (visible !== portraitVisible) {
      portraitVisible = visible;
      events.onPortraitVisible(visible);
    }
  }

  function resize() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    retarget();
    layout = structuredClone(target);
  }

  const px = (v: number) => `${v.toFixed(2)}px`;
  const place = (el: HTMLElement, x: number, y: number, s: number) => {
    el.style.transform = `translate3d(${px(x - s / 2)}, ${px(y - s / 2)}, 0) scale(${(s / PORTRAIT_BASE).toFixed(5)})`;
  };

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    const ease = (rate: number) => 1 - Math.exp(-dt * rate);

    p.x += (raw.x - p.x) * ease(6);
    p.y += (raw.y - p.y) * ease(6);
    presence += (presenceTarget - presence) * ease(3);

    const k = ease(reducedMotion ? 40 : 5);
    layout.portrait = lerpSpot(layout.portrait, target.portrait, k);
    layout.halo = lerpSpot(layout.halo, target.halo, k);
    // Портрет гаснет и появляется за ~250 мс.
    const fk = ease(reducedMotion ? 40 : 12);
    layout.portraitOpacity = lerp(layout.portraitOpacity, target.portraitOpacity, fk);
    layout.haloOpacity = lerp(layout.haloOpacity, target.haloOpacity, fk);

    const live = reducedMotion ? 0 : 1;
    const dx = (p.x - 0.5) * 2 * presence * live;
    const dy = (p.y - 0.5) * 2 * presence * live;
    const driftX = Math.sin(t / 9) * 2 * live;
    const driftY = Math.cos(t / 11) * 1.5 * live;

    // Портрет: до ~12px к курсору и едва заметно ближе к зрителю.
    const P = layout.portrait;
    const size = P.s * (1 + 0.008 * Math.abs(dx) * live);
    place(portrait, P.x + dx * 12 + driftX, P.y + dy * 7 + driftY, size);
    portrait.style.opacity = layout.portraitOpacity.toFixed(3);
    const Hs = layout.halo;
    place(halo, Hs.x + dx * 5, Hs.y + dy * 3, Hs.s);
    halo.style.opacity = layout.haloOpacity.toFixed(3);

    // Смена видео: полноэкранная шторка по направлению выбора и короткий сдвиг кадра.
    const progress = clamp01((t - changeAt) / (reducedMotion ? 0.3 : CHANGE_SECONDS));
    const wipe = smooth(progress);
    const burst = reducedMotion ? 0 : (1 - progress) ** 2;
    stage.style.setProperty("--ghost", (burst * 0.6 * layout.portraitOpacity).toFixed(3));
    stage.style.setProperty("--sep", px(1 + burst * 7));
    stage.style.setProperty("--dx", dx.toFixed(3));
    stage.style.setProperty("--dy", dy.toFixed(3));

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const incoming = i === selected && progress < 1;
      const visible = i === selected || (i === previous && progress < 1);
      layer.style.visibility = visible ? "visible" : "hidden";
      if (!visible) continue;

      // Само видео от курсора не движется — только короткий сдвиг при смене.
      const jump = incoming && !reducedMotion ? direction * 12 * (1 - wipe) : 0;
      layer.style.transform = `translate3d(${px(jump)}, 0, 0) scale(${OVERSCAN})`;
      const hidden = incoming && !reducedMotion ? ((1 - wipe) * 100).toFixed(2) : "";
      // В конце смены обрезки нет вовсе.
      layer.style.clipPath = hidden ? (direction > 0 ? `inset(0 0 0 ${hidden}%)` : `inset(0 ${hidden}% 0 0)`) : "";
      layer.style.zIndex = incoming ? "2" : "1";
      layer.style.opacity = incoming && reducedMotion ? progress.toFixed(3) : "1";
      layer.style.filter = incoming && !reducedMotion ? `brightness(${(1 + burst * 0.3).toFixed(3)})` : "";
    }
  }

  // ---- ввод ---------------------------------------------------------------
  let down: { x: number; y: number; id: number } | null = null;

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    raw.x = e.clientX / W;
    raw.y = e.clientY / H;
    presenceTarget = 1;
  };
  const onOut = (e: MouseEvent) => {
    if (!e.relatedTarget) presenceTarget = 0;
  };
  const onBlur = () => {
    presenceTarget = 0;
  };
  // Свайп не начинается с кнопок, ссылок и полей: там касание — это их действие.
  const onDown = (e: PointerEvent) => {
    const onControl = (e.target as Element).closest?.("button, a, input");
    down = e.pointerType === "touch" && !onControl ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null;
  };
  // Только осознанный горизонтальный свайп; вертикальное движение игнорируется.
  const onUp = (e: PointerEvent) => {
    const d = down;
    down = null;
    if (!d || d.id !== e.pointerId || e.type === "pointercancel") return;
    const ddx = e.clientX - d.x;
    const ddy = e.clientY - d.y;
    if (Math.abs(ddx) > 50 && Math.abs(ddx) > Math.abs(ddy) * 1.5) events.onSwipe(ddx < 0 ? 1 : -1);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("mouseout", onOut, { passive: true });
  window.addEventListener("blur", onBlur);
  stage.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  resize();
  events.onPortraitVisible(portraitVisible);
  raf = requestAnimationFrame(frame);

  return {
    select(scene: SceneId, dir: 1 | -1) {
      if (scene === selected) return;
      previous = selected;
      selected = scene;
      direction = dir;
      changeAt = t;
      retarget();
    },
    setMode(next: Mode) {
      mode = next;
      retarget();
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", onBlur);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", resize);
    },
  };
}

export type Engine = ReturnType<typeof createEngine>;
