import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { about, capabilities, schedule, scheduleNote, scheduleTitle, socials, type Mode } from "../data/site";
import { Links } from "./Links";

const NEW_TAB = " — откроется в новой вкладке";

function External({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children} <span className="arrow" aria-hidden="true">↗</span>
      <span className="sr-only">{NEW_TAB}</span>
    </a>
  );
}

/** Сегодняшний день стрима или ближайший следующий. */
function nearestDay() {
  const today = new Date().getDay();
  for (let offset = 0; offset < 7; offset++) {
    const day = (today + offset) % 7;
    const index = schedule.findIndex((entry) => entry.weekdays.includes(day));
    if (index !== -1) return { index, today: offset === 0 };
  }
  return null;
}

function About() {
  const major = capabilities.filter((entry) => entry.major);
  const minor = capabilities.filter((entry) => !entry.major);
  return (
    <>
      <h2 className="info__title">Обо мне</h2>
      <p className="info__lead">{about.lead}</p>
      <ul className="about-major">
        {major.map((entry) => (
          <li key={entry.title}>
            <h3>{entry.title}</h3>
            <p>{entry.description}</p>
          </li>
        ))}
      </ul>
      <ul className="about-minor">
        {minor.map((entry) => (
          <li key={entry.title}>
            <b>{entry.title}.</b> {entry.description}
          </li>
        ))}
      </ul>
    </>
  );
}

function Schedule() {
  const near = nearestDay();
  return (
    <>
      <h2 className="info__title info__title--mid">{scheduleTitle}</h2>
      <ol className="listing">
        {schedule.map((entry, index) => {
          const current = near?.index === index;
          return (
            <li
              key={entry.day}
              className={current ? "is-next" : undefined}
              style={{ ["--i" as string]: index }}
            >
              <span className="listing__day">{entry.day}</span>
              <span className="listing__time">
                {entry.time}
                {current ? <em>{near.today ? "сегодня" : "следующий"}</em> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="info__note">{scheduleNote}</p>
      <p className="info__note">Буду рад видеть тебя в чате.</p>
      <div className="actions">
        <External className="cta" href={socials.twitch}>
          Смотреть на Twitch
        </External>
        <External className="text-link" href={socials.telegram}>
          Анонсы в Telegram
        </External>
      </div>
    </>
  );
}

const LABELS = { about: "Обо мне", schedule: "Когда стрим", links: "Ссылки" } as const;

/**
 * Текст раздела поверх той же сцены. В AnimatePresence mode="sync" — с key={mode}:
 * новый раздел проявляется, пока прежний ещё гаснет, так что пустой паузы нет.
 */
export const InfoLayer = forwardRef<HTMLElement, { mode: Exclude<Mode, "home"> }>(function InfoLayer(
  { mode },
  ref,
) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.section
      ref={ref}
      className={`info info--${mode}`}
      aria-label={LABELS[mode]}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: reducedMotion ? 0.2 : 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeOut" } }}
    >
      {mode === "about" ? <About /> : mode === "schedule" ? <Schedule /> : <Links />}
    </motion.section>
  );
});
