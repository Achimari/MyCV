import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { intro, modes, scenes, socials, type Mode, type SceneId } from "../data/site";
import { createEngine, PORTRAIT_BASE, type Engine } from "./engine";
import { InfoLayer } from "./InfoLayer";
import { sound } from "./sound";

const PORTRAIT_SRCSET = "/images/achimari-portrait-800.webp 800w, /images/achimari-portrait.webp 1600w";
/** Маска для короткого «сдвига печати» портрета: прозрачность картинки. */
const SILHOUETTE = {
  maskImage: "url(/images/achimari-portrait-800.webp)",
  WebkitMaskImage: "url(/images/achimari-portrait-800.webp)",
};
const SUBJECTS = scenes.map((s) => ({ desktop: s.subjectDesktop, mobile: s.subjectMobile }));
const COUNT = scenes.length;
const MUSIC_KEY = "achimari-music";
const FX_KEY = "achimari-fx";
const VOLUME_KEY = "achimari-volume";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* хранилище недоступно — просто не запоминаем */
  }
}

const readPreference = (key: string) => read(key) !== "off";
const savePreference = (key: string, on: boolean) => save(key, on ? "on" : "off");

/** Фокус без жёлтой рамки, если его переносим мы, а не клавиатура посетителя. */
function moveFocus(el: HTMLElement | undefined, fromKeyboard: boolean) {
  el?.focus({ preventScroll: true, focusVisible: fromKeyboard } as FocusOptions);
}

/** Заранее подгрузить ролик: при наведении на номер, фокусе и в простое. */
function warm(video: HTMLVideoElement | undefined) {
  if (!video || video.preload === "auto") return;
  video.preload = "auto";
  if (video.readyState === 0) video.load();
}

function inertProps(on: boolean) {
  // React 18 не знает атрибут inert — передаём строкой.
  return on ? ({ inert: "" } as Record<string, string>) : {};
}

/** Тихий «тик» при наведении мышью; на касаниях не звучит. */
const hoverSound = {
  onPointerEnter: (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") sound.hover();
  },
};

/** С какой стороны текст раздела: напротив человека в кадре (для широкого экрана). */
function textSide(mode: Mode, scene: SceneId) {
  const subject = scenes[scene].subjectDesktop;
  if (mode === "about") return subject === "left" ? "right" : "left";
  if (mode === "schedule") return subject === "right" ? "left" : "right";
  return undefined;
}

export function Room() {
  const reducedMotion = Boolean(useReducedMotion());
  const [entered, setEntered] = useState(false);
  const [mode, setMode] = useState<Mode>("home");
  const [selected, setSelected] = useState<SceneId>(0);
  // При reduced motion видео не стартуют сами — только по кнопке.
  const [playing, setPlaying] = useState(!reducedMotion);
  const [musicOn, setMusicOn] = useState(() => readPreference(MUSIC_KEY));
  const [fxOn, setFxOn] = useState(() => readPreference(FX_KEY));
  const [portraitVisible, setPortraitVisible] = useState(true);
  const [volume, setVolume] = useState(() => {
    const v = Number(read(VOLUME_KEY));
    return Number.isFinite(v) && read(VOLUME_KEY) !== null ? v : 0.8;
  });
  const [soundOpen, setSoundOpen] = useState(false);
  const soundRef = useRef<HTMLDivElement>(null);
  const [announce, setAnnounce] = useState("");

  const stageRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<HTMLDivElement[]>([]);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const portraitRef = useRef<HTMLButtonElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLElement>(null);
  const navRefs = useRef<HTMLButtonElement[]>([]);
  const engineRef = useRef<Engine | null>(null);
  const selectedRef = useRef<SceneId>(0);
  const modeRef = useRef<Mode>("home");

  const select = useCallback((scene: SceneId, dir?: 1 | -1) => {
    const current = selectedRef.current;
    if (scene === current) return;
    const direction = dir ?? (scene > current ? 1 : -1);
    engineRef.current?.select(scene, direction);
    selectedRef.current = scene;
    setSelected(scene);
    setAnnounce(`Выбрано видео ${scene + 1}`);
    sound.select(direction);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => select((selectedRef.current + dir + COUNT) % COUNT, dir),
    [select],
  );

  // Спрятанный портрет не должен держать фокус: переводим его в навигацию.
  const onPortraitVisible = useCallback((visible: boolean) => {
    if (!visible && document.activeElement === portraitRef.current) {
      moveFocus(navRefs.current[modes.findIndex((m) => m.id === modeRef.current)], true);
    }
    setPortraitVisible(visible);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const portrait = portraitRef.current;
    const halo = haloRef.current;
    if (!stage || !portrait || !halo) return;
    const engine = createEngine(
      { stage, layers: layerRefs.current, portrait, halo },
      { onSwipe: step, onPortraitVisible },
      reducedMotion,
      selectedRef.current,
      SUBJECTS,
    );
    engine.setMode(modeRef.current);
    engineRef.current = engine;
    return () => engine.destroy();
  }, [reducedMotion, step, onPortraitVisible]);

  // Играет только выбранное видео; остальные на паузе и сохраняют позицию.
  // Прежнее доигрывает время шторки. Невыбранные заранее не качаются (preload="none").
  useEffect(() => {
    const timers: number[] = [];
    videoRefs.current.forEach((video, i) => {
      if (playing && i === selected) {
        video.play().catch((err: DOMException) => err.name === "NotAllowedError" && setPlaying(false));
      } else {
        timers.push(window.setTimeout(() => video.pause(), 700));
      }
    });
    return () => timers.forEach(window.clearTimeout);
  }, [playing, selected]);

  const changeMode = useCallback((next: Mode) => {
    if (modeRef.current !== next) sound.navigate();
    sound.setMode(next);
    modeRef.current = next;
    setMode(next);
    engineRef.current?.setMode(next);
    // Если фокус был внутри уходящего текста — возвращаем его в навигацию.
    if (infoRef.current?.contains(document.activeElement)) {
      moveFocus(navRefs.current[modes.findIndex((m) => m.id === next)], true);
    }
  }, []);

  useEffect(() => sound.setVolume(volume), [volume]);

  // Соседние ролики подогреваются в простое, когда выбранный уже играет.
  useEffect(() => {
    if (!entered) return;
    const id = window.setTimeout(() => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
      idle(() => {
        warm(videoRefs.current[(selected + 1) % COUNT]);
        warm(videoRefs.current[(selected - 1 + COUNT) % COUNT]);
      });
    }, 2500);
    return () => window.clearTimeout(id);
  }, [entered, selected]);

  // Панель звука закрывается касанием мимо неё.
  useEffect(() => {
    if (!soundOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!soundRef.current?.contains(e.target as Node)) setSoundOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [soundOpen]);

  useEffect(() => {
    if (!entered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Escape сначала закрывает панель звука, и только потом ведёт на Главную.
      if (e.key === "Escape" && soundOpen) {
        setSoundOpen(false);
        moveFocus(soundRef.current?.querySelector("button") ?? undefined, true);
        return;
      }
      // Стрелки в ползунке громкости двигают ползунок, а не видео.
      if ((e.target as Element).closest?.("input")) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= COUNT) select(n - 1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Escape") changeMode("home");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entered, select, step, changeMode, soundOpen]);

  // Внешние ссылки: короткий звук подтверждения, переход не задерживается.
  // У соцсетей своя нота (data-note), у остальных — общий сигнал.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // После щелчка мышью кнопка не держит фокус: иначе клавиши 1–6 включили бы
      // на ней жёлтую рамку клавиатурного фокуса.
      const button = (e.target as Element).closest?.<HTMLElement>("button");
      if (button && e.detail > 0) button.blur();
      const link = (e.target as Element).closest?.<HTMLElement>('a[target="_blank"]');
      if (!link) return;
      if (link.dataset.note) sound.linkOpen(Number(link.dataset.note));
      else sound.link();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const enter = async (e: React.MouseEvent) => {
    setEntered(true);
    savePreference(MUSIC_KEY, musicOn);
    savePreference(FX_KEY, fxOn);
    videoRefs.current[selectedRef.current]?.play().catch(() => undefined);
    // С клавиатуры фокус переходит в навигацию; мышью — никуда не прыгает.
    const fromKeyboard = e.detail === 0;
    if (fromKeyboard) requestAnimationFrame(() => moveFocus(navRefs.current[0], true));
    sound.setMode(modeRef.current);
    await Promise.all([sound.setEffects(fxOn), sound.setMusic(musicOn)]);
    sound.enter();
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    savePreference(MUSIC_KEY, next);
    void sound.setMusic(next);
  };

  const toggleFx = async () => {
    const next = !fxOn;
    setFxOn(next);
    savePreference(FX_KEY, next);
    await sound.setEffects(next);
    if (next) sound.enter();
  };

  const entrySound = musicOn || fxOn;
  const warmProps = (scene: SceneId) => ({
    onPointerEnter: () => warm(videoRefs.current[scene]),
    onFocus: () => warm(videoRefs.current[scene]),
    onTouchStart: () => warm(videoRefs.current[scene]),
  });
  const prev = (selected - 1 + COUNT) % COUNT;
  const next = (selected + 1) % COUNT;

  return (
    <div className="room" data-mode={mode} data-text={textSide(mode, selected)}>
      <header className="top" {...inertProps(!entered)}>
        <p className="wordmark">Achimari</p>
        <nav className="modes" aria-label="Разделы">
          <ul>
            {modes.map((m, i) => (
              <li key={m.id}>
                <button
                  type="button"
                  ref={(el) => {
                    if (el) navRefs.current[i] = el;
                  }}
                  aria-current={mode === m.id ? "true" : undefined}
                  onClick={() => changeMode(m.id)}
                  {...hoverSound}
                >
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="scene" {...inertProps(!entered)}>
        <div className="stage" ref={stageRef}>
          {scenes.map((scene, i) => (
            <div
              key={scene.id}
              className="layer"
              aria-hidden="true"
              ref={(el) => {
                if (el) layerRefs.current[i] = el;
              }}
            >
              <video
                ref={(el) => {
                  if (el) videoRefs.current[i] = el;
                }}
                src={scene.src}
                poster={scene.poster}
                style={{ ["--focus-d" as string]: scene.focusDesktop, ["--focus-m" as string]: scene.focusMobile }}
                muted
                loop
                playsInline
                autoPlay={!reducedMotion && i === 0}
                // Шесть роликов сразу не качаем: первый — сразу, соседей греем позже (warm).
                preload={i === 0 && !reducedMotion ? "auto" : "none"}
              />
            </div>
          ))}

          <h1 className="title">Achimari</h1>
          <div className="halo" ref={haloRef} aria-hidden="true" />

          <button
            type="button"
            className="portrait"
            ref={portraitRef}
            style={{ width: PORTRAIT_BASE, height: PORTRAIT_BASE }}
            onClick={() => {
              sound.portrait();
              step(1);
            }}
            aria-label="Портрет Achimari. Следующее видео"
            // Спрятанный портрет не ловит ни фокус, ни клики, ни экранный диктор.
            tabIndex={portraitVisible ? undefined : -1}
            aria-hidden={portraitVisible ? undefined : true}
            data-hidden={portraitVisible ? undefined : ""}
            {...inertProps(!portraitVisible)}
            {...hoverSound}
          >
            <span className="portrait__ghost portrait__ghost--cyan" style={SILHOUETTE} />
            <span className="portrait__ghost portrait__ghost--yellow" style={SILHOUETTE} />
            <img
              className="portrait__image"
              srcSet={PORTRAIT_SRCSET}
              sizes="(max-width: 760px) 400px, 800px"
              src="/images/achimari-portrait.webp"
              alt=""
              width={1600}
              height={1600}
              draggable={false}
            />
          </button>

          <div className="grain" aria-hidden="true" />
        </div>

        <div className="intro">
          <p>{intro}</p>
          <a href={socials.twitch} target="_blank" rel="noopener noreferrer" {...hoverSound}>
            Смотреть на Twitch <span className="arrow" aria-hidden="true">↗</span>
            <span className="sr-only"> — откроется в новой вкладке</span>
          </a>
        </div>

        {/* sync: входящий раздел появляется, пока уходящий гаснет, — без пустой паузы. */}
        <AnimatePresence mode="sync" initial={false}>
          {mode !== "home" && <InfoLayer key={mode} ref={infoRef} mode={mode} />}
        </AnimatePresence>

        <section className="picker" aria-label="Видео">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              aria-pressed={selected === scene.id}
              aria-label={`Показать видео ${scene.id + 1}`}
              onClick={() => select(scene.id)}
              {...hoverSound}
              {...warmProps(scene.id)}
            >
              {scene.number}
            </button>
          ))}
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
        </section>

        {/* Телефон: компактный переключатель видео вместо ряда из шести номеров. */}
        <div className="pager" role="group" aria-label="Видео">
          <button type="button" aria-label="Предыдущее видео" onClick={() => step(-1)} {...warmProps(prev)}>
            <span aria-hidden="true">‹</span>
          </button>
          <span className="pager__count" aria-hidden="true">
            {scenes[selected].number} <span>/ {String(COUNT).padStart(2, "0")}</span>
          </span>
          <button type="button" aria-label="Следующее видео" onClick={() => step(1)} {...warmProps(next)}>
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="controls">
          <button
            type="button"
            className="controls__play"
            aria-pressed={!playing}
            onClick={() => {
              if (playing) sound.pause();
              else sound.play();
              setPlaying(!playing);
            }}
            {...hoverSound}
          >
            {playing ? "Пауза" : "Смотреть"}
            <span className="sr-only"> видео</span>
          </button>
          <div className="sound" ref={soundRef}>
            <button
              type="button"
              className="sound-toggle"
              aria-expanded={soundOpen}
              aria-controls="sound-panel"
              onClick={() => setSoundOpen(!soundOpen)}
              {...hoverSound}
            >
              <span className="sound-toggle__dot" data-on={musicOn || fxOn ? "" : undefined} aria-hidden="true" />
              Звук
            </button>
            {soundOpen ? (
              <div className="sound__panel" id="sound-panel" role="group" aria-label="Звук">
                <button type="button" className="sound__row" aria-pressed={musicOn} onClick={toggleMusic}>
                  <span>Музыка</span>
                  <span className="sound__state">{musicOn ? "вкл" : "выкл"}</span>
                </button>
                <button type="button" className="sound__row" aria-pressed={fxOn} onClick={toggleFx}>
                  <span>Эффекты</span>
                  <span className="sound__state">{fxOn ? "вкл" : "выкл"}</span>
                </button>
                <label className="sound__volume">
                  <span>Громкость</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume(v);
                      save(VOLUME_KEY, String(v));
                    }}
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {!entered && (
          <motion.div
            className="entry"
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.8, ease: [0.7, 0, 0.2, 1] }}
          >
            <img className="entry__portrait" src="/images/achimari-portrait-800.webp" alt="" width={800} height={800} />
            <p className="entry__name">Achimari</p>
            <div className="entry__actions">
              <button type="button" className="entry__open" onClick={enter} autoFocus>
                Открыть
              </button>
              <button
                type="button"
                className="sound-toggle"
                aria-pressed={entrySound}
                onClick={() => {
                  setMusicOn(!entrySound);
                  setFxOn(!entrySound);
                }}
              >
                <span className="sound-toggle__dot" aria-hidden="true" />
                {entrySound ? "Со звуком" : "Без звука"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
