import { useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { socialLinks } from "../data/site";

export function Footer() {
  const reducedMotion = useReducedMotion();
  const year = new Date().getFullYear();

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <footer className="dashboard-footer">
      <div className="dashboard-shell dashboard-footer__row">
        <strong>ACHIMARI © {year}</strong>
        <nav aria-label="Социальные сети">
          <ul>
            {socialLinks.map((entry) => (
              <li key={entry.key}>
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {entry.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" onClick={toTop} aria-label="Наверх страницы">
          <span>Наверх</span>
          <ArrowUp aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}

export default Footer;
