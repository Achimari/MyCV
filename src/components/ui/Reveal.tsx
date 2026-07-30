import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Короткое появление секции — строго как усиление, а не как условие видимости.
 *
 * Базовое состояние всегда видимое. Прозрачным элемент становится только если
 * при монтировании он подтверждённо ниже экрана. Дополнительно:
 *   — при отключённом движении или без IntersectionObserver анимации нет вовсе;
 *   — пересчёт на resize (в том числе при экспорте страницы целиком);
 *   — жёсткий таймаут, после которого содержимое показывается в любом случае.
 * Поэтому «залипнуть» на opacity: 0 элемент не может.
 */
const HARD_FALLBACK_MS = 2000;

const TAGS = { div: motion.div, header: motion.header, ul: motion.ul } as const;

export interface RevealProps {
  children: ReactNode;
  /** Задержка внутри группы, в секундах. Держим в пределах 0–0.12. */
  delay?: number;
  className?: string;
  as?: keyof typeof TAGS;
  /** Доступное имя списка/секции, если его не даёт заголовок рядом. */
  ariaLabel?: string;
}

export function Reveal({ children, delay = 0, className, as = "div", ariaLabel }: RevealProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    if (reducedMotion || typeof IntersectionObserver !== "function") return;

    const element = ref.current;
    if (!element) return;

    // Уже на экране при загрузке — не прячем и не анимируем.
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setArmed(true);

    const reveal = () => setShown(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);

    // Экран вырос (поворот, зум, экспорт всей страницы) — пересчитываем.
    const onResize = () => {
      if (ref.current && ref.current.getBoundingClientRect().top < window.innerHeight) reveal();
    };
    window.addEventListener("resize", onResize, { passive: true });

    const fallback = window.setTimeout(reveal, HARD_FALLBACK_MS);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(fallback);
    };
  }, [reducedMotion]);

  const MotionTag = TAGS[as];
  const hidden = armed && !shown;

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      aria-label={ariaLabel}
      data-reveal={hidden ? "pending" : "shown"}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? 18 : 0 }}
      initial={false}
      transition={{ duration: 0.56, delay: hidden ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}

export default Reveal;
