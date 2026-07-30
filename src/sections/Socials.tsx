import { SectionHeader } from "../components/dashboard/SectionHeader";
import { SocialLink } from "../components/SocialLink";
import { Reveal } from "../components/ui/Reveal";
import { socialLinks } from "../data/site";

export function Socials() {
  return (
    <section id="socials" className="dashboard-section dashboard-socials">
      <div className="dashboard-shell">
        <SectionHeader
          number="03"
          label="Каналы связи"
          title="ВЫБЕРИ СВОЮ ЧАСТОТУ."
          description="Игры, музыка, стихи, вера, ирония и честные разговоры продолжаются на этих площадках."
        />

        <Reveal as="ul" className="channel-list" delay={0.06}>
          {socialLinks.map((entry, index) => (
            <SocialLink key={entry.key} entry={entry} index={index} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export default Socials;
