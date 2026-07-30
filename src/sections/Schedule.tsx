import { SectionHeader } from "../components/dashboard/SectionHeader";
import { OutlineButton, PrimaryButton } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";
import { schedule, socials } from "../data/site";

export function Schedule() {
  return (
    <section id="schedule" className="dashboard-section dashboard-schedule">
      <div className="dashboard-shell">
        <SectionHeader
          number="02"
          label="План передач"
          title="РАСПИСАНИЕ РЕШАЕТСЯ ВЕЧЕРОМ."
          description="Но не точно. Актуальное объявление появляется в Telegram и на Twitch."
        />

        <div className="schedule-layout">
          <Reveal as="ul" className="schedule-table" delay={0.06} ariaLabel="Расписание стримов">
            {schedule.map((entry, index) => (
              <li className="schedule-table__row" key={entry.days}>
                <span className="schedule-table__no" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{entry.days}</strong>
                <span className="schedule-table__note">
                  <span className="schedule-table__note-main">{entry.note.main}</span>
                  <span className="schedule-table__note-qualifier">{entry.note.qualifier}</span>
                </span>
              </li>
            ))}
          </Reveal>

          <div className="dashboard-action-row schedule-layout__actions">
            <PrimaryButton
              href={socials.telegram}
              size="md"
              ariaLabel="Расписание в Telegram — откроется в новой вкладке"
            >
              Расписание в Telegram
            </PrimaryButton>
            <OutlineButton
              href={socials.twitch}
              size="md"
              ariaLabel="Проверить эфир на Twitch — откроется в новой вкладке"
            >
              Проверить эфир
            </OutlineButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Schedule;
