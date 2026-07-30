import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "../components/dashboard/SectionHeader";
import { Reveal } from "../components/ui/Reveal";
import { capabilities, socials } from "../data/site";

export function StreamContent() {
  return (
    <section id="streams" className="dashboard-section dashboard-streams">
      <div className="dashboard-shell">
        <SectionHeader
          number="01"
          label="Эфир и человек"
          title="БЕЗ ГЛЯНЦА. БЕЗ ПРАВИЛЬНЫХ ЛОЗУНГОВ."
          description="Только игры, музыка, вера, ирония и честные разговоры под мерцание старого экрана."
        />

        <Reveal className="broadcast-grid" delay={0.06}>
          <a
            className="broadcast-monitor"
            href={socials.twitch}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Проверить эфир ACHIMARI на Twitch — откроется в новой вкладке"
          >
            <span className="broadcast-monitor__scan" aria-hidden="true" />
            <span className="dashboard-label">Twitch / внешний сигнал</span>
            <strong>ПРОВЕРИТЬ<br />ЭФИР</strong>
            <span className="broadcast-monitor__status">Статус открывается на Twitch</span>
            <ArrowUpRight aria-hidden="true" />
          </a>

          <div className="broadcast-capabilities">
            <p className="broadcast-capabilities__title">Что попадает в эфир</p>
            <ul>
              {capabilities.map((capability) => (
                <li key={capability.code}>
                  <span>{capability.code}</span>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default StreamContent;
