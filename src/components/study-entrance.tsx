"use client";
import Link from "next/link";
import { AnimatedMascot } from "./animated-mascot";
import { UiIcon } from "./ui-icon";
type Props = { preparing?: boolean; compact?: boolean } & (
  { href: string; onOpen?: never } | { href?: never; onOpen: () => void }
);
export function StudyEntrance({
  href,
  onOpen,
  preparing = false,
  compact = false,
}: Props) {
  const content = (
    <>
      <span className="entrance-balloon">
        {!compact && "Studiamo insieme?"}
        <span className="entrance-hint">
          {preparing
            ? "Apri lo spazio di studio"
            : "Apri lo zaino degli strumenti"}{" "}
          <UiIcon name="arrow" />
        </span>
      </span>
      <AnimatedMascot pose="welcome" />
      <span className="entrance-ground" aria-hidden="true" />
    </>
  );
  const label = preparing
    ? "Apri lo spazio di studio: attività in preparazione"
    : "Apri gli strumenti di studio";
  return href ? (
    <Link href={href} className="mascot-entrance" aria-label={label}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      className="mascot-entrance"
      aria-label={label}
      onClick={onOpen}
    >
      {content}
    </button>
  );
}
