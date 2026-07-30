import { ArrowUpRight } from "lucide-react";
import type { SocialEntry } from "../data/site";

export function SocialLink({ entry, index }: { entry: SocialEntry; index: number }) {
  return (
    <li className="channel-row">
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${entry.name} — ${entry.description}, откроется в новой вкладке`}
      >
        <span className="channel-row__index">{String(index + 1).padStart(2, "0")}</span>
        <span className="channel-row__name">{entry.name}</span>
        <span className="channel-row__description">{entry.description}</span>
        <span className="channel-row__handle">{entry.handle}</span>
        <span className="channel-row__arrow">
          <ArrowUpRight aria-hidden="true" />
        </span>
      </a>
    </li>
  );
}

export default SocialLink;
