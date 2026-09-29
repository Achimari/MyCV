import { useRef, useState } from "react";
import { socialLinks } from "../data/site";
import { sound } from "./sound";

/**
 * Ссылки у краёв экрана — центр остаётся видео. Наведение и фокус дают одно
 * и то же: имя выходит вперёд, рядом появляются описание и ник, звучит нота
 * этой ссылки. Портрет, видео и фон при этом не меняются.
 * На телефоне — список внизу с описаниями; одно касание открывает ссылку.
 */
export function Links() {
  const [active, setActive] = useState<number | null>(null);
  const touchAt = useRef(0);

  const activate = (index: number, withSound: boolean) => {
    setActive(index);
    if (withSound) sound.linkFocus(index);
  };

  return (
    <>
      <h2 className="sr-only">Ссылки</h2>
      <ul className="constellation" data-active={active === null ? undefined : ""}>
        {socialLinks.map((entry, index) => (
          <li key={entry.key} className={`star star--${entry.key}`}>
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              data-note={index}
              data-on={active === index ? "" : undefined}
              onPointerDown={(e) => {
                if (e.pointerType !== "mouse") touchAt.current = performance.now();
              }}
              onPointerEnter={(e) => e.pointerType === "mouse" && activate(index, true)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
              // Фокус после касания — без ноты: на телефоне касание сразу открывает ссылку.
              onFocus={() => activate(index, performance.now() - touchAt.current > 800)}
              onBlur={() => setActive(null)}
            >
              <span className="star__name">
                {entry.name}{" "}
                <span className="arrow" aria-hidden="true">
                  ↗
                </span>
              </span>
              <span className="star__desc">
                {entry.description}
                <span className="star__handle"> {entry.handle}</span>
              </span>
              <span className="sr-only"> — откроется в новой вкладке</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="info__footer">Achimari © {new Date().getFullYear()}</p>
    </>
  );
}
