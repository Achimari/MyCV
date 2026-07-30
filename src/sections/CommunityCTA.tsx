import { OutlineButton, PrimaryButton } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";
import { socials } from "../data/site";

export function CommunityCTA() {
  return (
    <section id="community" className="dashboard-section community-cta">
      <div className="dashboard-shell">
        <Reveal className="community-cta__panel">
          <div className="community-cta__copy">
            {/* Плакатная развёрстка: три ступени вместо сплошной стены слов. */}
            <h2>
              ТОВАРИЩ,
              <br />
              НЕ ПРОХОДИ МИМО.
              <br />
              ЭФИР УЖЕ НАЧАЛСЯ.
            </h2>
            <span>Заходи в чат и оставайся на связи.</span>
          </div>
          <div className="community-cta__actions">
            <PrimaryButton
              href={socials.twitch}
              ariaLabel="Открыть Twitch ACHIMARI — откроется в новой вкладке"
            >
              Twitch
            </PrimaryButton>
            <OutlineButton
              href={socials.telegram}
              ariaLabel="Открыть Telegram ACHIMARI — откроется в новой вкладке"
            >
              Telegram
            </OutlineButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default CommunityCTA;
