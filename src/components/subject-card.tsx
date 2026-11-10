import Link from "next/link";
import { getResourcesForSubject } from "@/lib/catalog/resources";
import type { Subject } from "@/lib/catalog/types";
import { UiIcon } from "./ui-icon";
import { getPublishedBank, getCanonicalResource } from "@/lib/study/published";
import { getPublishedTools } from "@/lib/learning-tools/published";

export function SubjectCard({ subject }: { subject: Subject }) {
  const count = getResourcesForSubject(subject.slug).length;
  const { bank } = getPublishedBank(subject.slug),
    { tools } = getPublishedTools(subject.slug);
  const labels = [
    getCanonicalResource(subject.slug) ? "Appunti" : count ? "Documenti" : null,
    bank?.quiz.length ? "Quiz" : null,
    bank?.flashcards.length ? "Flashcard" : null,
    tools.some((tool) => tool.input.kind === "map") ? "Mappe" : null,
    tools.some((tool) => tool.input.kind === "podcast") ? "Podcast" : null,
  ].filter(Boolean);
  return (
    <Link href={"/insegnamenti/" + subject.slug} className="subject-card group">
      <div className="subject-card-top">
        <span className="subject-stamp" aria-hidden="true">
          {subject.label}
        </span>
        <span className="text-xs text-muted">
          {count
            ? count + (count === 1 ? " materiale" : " materiali")
            : "In preparazione"}
        </span>
      </div>
      <h3 className="subject-title">{subject.title}</h3>
      <p className="subject-available">
        {labels.length
          ? labels.join(" · ")
          : "Stiamo preparando i primi materiali."}
      </p>
      <span className="subject-card-action">
        Entra nella materia <UiIcon name="arrow" />
      </span>
    </Link>
  );
}
