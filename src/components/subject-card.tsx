import Link from "next/link";
import { getResourcesForSubject } from "@/lib/catalog/resources";
import type { Subject } from "@/lib/catalog/types";

type SubjectCardProps = {
  subject: Subject;
};

export function SubjectCard({ subject }: SubjectCardProps) {
  const titleId = `subject-${subject.slug}`;
  const count = getResourcesForSubject(subject.slug).length;
  const resourceLabel = count === 1 ? "1 materiale disponibile" : `${count} materiali disponibili`;

  return (
    <Link
      href={`/insegnamenti/${subject.slug}`}
      aria-labelledby={titleId}
      className="group flex min-w-0 flex-col rounded-2xl border border-border bg-white p-6 hover:border-accent sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 font-mono text-sm font-semibold text-accent"
        >
          {subject.label}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-muted">
          {count > 0 ? resourceLabel : "Materiali in preparazione"}
        </span>
      </div>
      <h3 id={titleId} className="mt-6 text-xl font-semibold leading-7 tracking-tight group-hover:text-accent">
        {subject.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted">{subject.description}</p>
      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-accent">
        Apri insegnamento <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
