import Link from "next/link";
import { formatFileSize } from "@/lib/catalog/format";
import type { StudyResource } from "@/lib/catalog/resource-types";
import { UiIcon } from "./ui-icon";
import { BrandIllustration } from "./brand-illustration";

type Props = {
  resource: StudyResource;
  headingLevel?: 2 | 3 | 4;
  contextLabel?: string;
  featured?: boolean;
};
export function ResourceCard({
  resource,
  headingLevel = 4,
  contextLabel,
  featured = false,
}: Props) {
  const Heading = ("h" + headingLevel) as "h2" | "h3" | "h4";
  return (
    <article
      className={"resource-card" + (featured ? " resource-featured" : "")}
    >
      {featured && (
        <BrandIllustration kind="hanging" className="document-companion" />
      )}
      <div className="resource-card-heading">
        <div className="resource-mark" aria-hidden="true">
          <UiIcon name="book" />
        </div>
        <div className="min-w-0">
          <p className="eyebrow">
            {featured
              ? "Gli appunti condivisi"
              : (contextLabel ?? "Materiale di studio")}
          </p>
          {featured && contextLabel && (
            <p className="mt-1 text-xs leading-6 text-muted">{contextLabel}</p>
          )}
          <Heading className="resource-title">
            <Link href={"/risorse/" + resource.id}>{resource.title}</Link>
          </Heading>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">
        {resource.description}
      </p>
      <p className="mt-4 text-xs leading-6 text-muted">
        PDF · {resource.pageCount} pagine · {formatFileSize(resource.byteSize)}
      </p>
      <p className="text-xs leading-6 text-muted">
        {resource.authors.join(", ")} · A.A. {resource.academicYear}
      </p>
      <p className="mt-2 text-xs leading-6 text-accent">{resource.status}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        <Link
          href={"/risorse/" + resource.id}
          className="button-primary"
          aria-label={"Leggi documento: " + resource.title}
        >
          {featured ? "Leggi gli appunti" : "Leggi documento"}{" "}
          <UiIcon name="arrow" />
        </Link>
        <a
          href={resource.fileUrl}
          download
          className="button-secondary"
          aria-label={"Scarica PDF: " + resource.title}
        >
          <UiIcon name="download" /> Scarica PDF
        </a>
      </div>
    </article>
  );
}
