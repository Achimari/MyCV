import { Reveal } from "../ui/Reveal";

interface SectionHeaderProps {
  number: string;
  label: string;
  title: string;
  description?: string;
}

export function SectionHeader({ number, label, title, description }: SectionHeaderProps) {
  return (
    <Reveal as="header" className="dashboard-heading">
      <p className="dashboard-heading__meta">
        <span className="dashboard-heading__index">{number}</span>
        {label}
      </p>
      <h2>{title}</h2>
      {description ? <p className="dashboard-heading__description">{description}</p> : null}
    </Reveal>
  );
}

export default SectionHeader;
