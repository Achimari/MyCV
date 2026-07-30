import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Radio, X } from "lucide-react";
import { navLinks, socials } from "../data/site";

/** Секции без своего пункта меню подсвечивают ближайший по смыслу. */
const SECTION_TO_NAV: Record<string, string> = {
  about: "about",
  streams: "streams",
  schedule: "streams",
  socials: "socials",
  community: "socials",
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Navbar() {
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("about");
  const scrolledRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Порог, а не состояние на каждый кадр: setState вызывается только при пересечении.
    const onScroll = () => {
      const next = window.scrollY > 24;
      if (next === scrolledRef.current) return;
      scrolledRef.current = next;
      setScrolled(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = Object.keys(SECTION_TO_NAV)
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (current) setActive(SECTION_TO_NAV[current.target.id] ?? current.target.id);
      },
      { rootMargin: "-42% 0px -48% 0px", threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Модальное поведение меню: Escape, ловушка фокуса, inert для фона, возврат фокуса.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const background = [
      document.getElementById("main-content"),
      document.querySelector("footer"),
    ].filter((element): element is HTMLElement => Boolean(element));

    background.forEach((element) => element.setAttribute("inert", ""));
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const menu = menuRef.current;
      const toggle = toggleRef.current;
      if (!menu || !toggle) return;

      const items = [...menu.querySelectorAll<HTMLElement>(FOCUSABLE), toggle];
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      background.forEach((element) => element.removeAttribute("inert"));
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const scrollTo = useCallback(
    (id: string) => {
      setOpen(false);
      document.getElementById(id)?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [reducedMotion],
  );

  return (
    <>
      <a className="archive-skip-link" href="#main-content">
        Перейти к содержанию
      </a>

      <header className={`archive-nav ${scrolled ? "archive-nav--scrolled" : ""}`}>
        <nav className="archive-nav__inner" aria-label="Основная навигация">
          <a
            className="archive-nav__brand"
            href="#about"
            onClick={(event) => {
              event.preventDefault();
              scrollTo("about");
            }}
          >
            <b>ACHIMARI</b>
          </a>

          <ul className="archive-nav__links">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  aria-current={active === link.id ? "true" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollTo(link.id);
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <a
            className="archive-nav__signal"
            href={socials.twitch}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Проверить эфир ACHIMARI на Twitch — откроется в новой вкладке"
          >
            <Radio aria-hidden="true" />
            <span className="archive-nav__signal-label">Проверить эфир</span>
          </a>

          <button
            className="archive-nav__menu"
            type="button"
            ref={toggleRef}
            aria-expanded={open}
            aria-controls="archive-mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="archive-mobile-menu"
            className="archive-mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Навигация ACHIMARI"
            initial={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <p>Навигация / ACHIMARI</p>
            <ol>
              {navLinks.map((link, index) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollTo(link.id);
                    }}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ol>
            <a
              className="archive-action archive-action--primary"
              href={socials.twitch}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Проверить эфир ACHIMARI на Twitch — откроется в новой вкладке"
            >
              Проверить эфир
              <Radio aria-hidden="true" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
