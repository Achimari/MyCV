import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
const WATERMARK_ROWS_DESKTOP = 20;
const WATERMARK_ROWS_COMPACT = 12;
const WATERMARK_ITEMS_PER_GROUP = 9;
const watermarkGroups = Array.from({ length: 2 });
const watermarkItems = Array.from({ length: WATERMARK_ITEMS_PER_GROUP });

/** На узких экранах диагональное поле рендерится меньшим числом строк. */
function useWatermarkRows() {
  const [rows, setRows] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
      ? WATERMARK_ROWS_COMPACT
      : WATERMARK_ROWS_DESKTOP,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const sync = () => setRows(query.matches ? WATERMARK_ROWS_COMPACT : WATERMARK_ROWS_DESKTOP);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return rows;
}

export function About() {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const watermarkRows = useWatermarkRows();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const portraitX = useSpring(pointerX, { stiffness: 70, damping: 24, mass: 0.5 });
  const portraitY = useSpring(pointerY, { stiffness: 70, damping: 24, mass: 0.5 });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
    // Измеряем после отрисовки — иначе Framer предупреждает о статичном контейнере.
    layoutEffect: false,
  });
  const portraitScrollY = useTransform(scrollYProgress, [0, 1], [0, reducedMotion ? 0 : 28]);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    // Мягкий параллакс: портрет реагирует, но не «плавает» под курсором.
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 7);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section
      id="about"
      ref={ref}
      className="about-opening"
      aria-labelledby="about-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="about-opening__scanlines" aria-hidden="true" />
      <div className="about-opening__watermarks" aria-hidden="true">
        {Array.from({ length: watermarkRows }).map((_, rowIndex) => (
          <div className="about-opening__watermark-row" key={rowIndex}>
            <div
              className="about-opening__watermark-track"
              style={{ animationDelay: `${rowIndex * -3.7}s` }}
            >
              {watermarkGroups.map((__, groupIndex) => (
                <div className="about-opening__watermark-group" key={groupIndex}>
                  {watermarkItems.map((___, itemIndex) => (
                    <span className="about-opening__watermark-item" key={itemIndex}>
                      ACHIMARI
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-shell about-opening__shell">
        <div className="about-opening__grid">
          <div className="about-opening__manifesto">
            {/* Перенос задан явно: две строки — решение композиции, а не
                результат случайной ширины колонки на конкретном экране. */}
            <h1 id="about-title">
              СИГНАЛ ИЗ
              <br />
              БЕТОННЫХ ОКРАИН.
            </h1>
            <p>Игры, музыка, вера и честные разговоры. Остальное – в эфире.</p>
          </div>

          <div className="about-opening__portrait-frame">
            <motion.div
              className="about-opening__portrait-drift"
              style={{ x: portraitX, y: portraitY }}
            >
              <motion.div className="about-opening__portrait-shift" style={{ y: portraitScrollY }}>
                <img
                  className="about-opening__portrait-image"
                  src="/images/achimari-portrait.webp"
                  alt="Сине-жёлтый портрет ACHIMARI в круглых очках"
                  width="1600"
                  height="1600"
                  decoding="async"
                  // React 18 не знает camelCase fetchPriority и молча его теряет —
                  // передаём настоящий HTML-атрибут, чтобы приоритет LCP применился.
                  {...({ fetchpriority: "high" } as Record<string, string>)}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
