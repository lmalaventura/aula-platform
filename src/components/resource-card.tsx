import Link from "next/link";
import { formatFileSize } from "@/lib/catalog/format";
import type { StudyResource } from "@/lib/catalog/resource-types";

type ResourceCardProps = {
  resource: StudyResource;
};

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        PDF · {resource.pageCount} pagine · {formatFileSize(resource.byteSize)}
      </p>
      <h4 className="mt-3 text-xl font-semibold leading-7">
        <Link href={`/risorse/${resource.id}`} className="hover:text-accent hover:underline">
          {resource.title}
        </Link>
      </h4>
      <p className="mt-3 text-sm leading-7 text-muted">{resource.description}</p>
      <p className="mt-4 text-sm text-muted">
        {resource.authors.join(", ")} · A.A. {resource.academicYear}
      </p>
      <p className="mt-2 text-sm font-medium text-accent">{resource.status}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/risorse/${resource.id}`}
          className="inline-flex min-h-12 items-center rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-accent"
          aria-label={`Leggi ${resource.title}`}
        >
          Leggi gli appunti
        </Link>
        <a
          href={resource.fileUrl}
          download
          className="inline-flex min-h-12 items-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-accent hover:border-accent"
          aria-label={`Scarica ${resource.title} in PDF`}
        >
          Scarica PDF
        </a>
      </div>
    </article>
  );
}
