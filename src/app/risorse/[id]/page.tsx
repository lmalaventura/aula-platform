import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PdfReader } from "@/components/pdf-reader";
import { UiIcon } from "@/components/ui-icon";
import { getSubjectBySlug } from "@/lib/catalog";
import { formatFileSize } from "@/lib/catalog/format";
import { getResourceById, getResources } from "@/lib/catalog/resources";
import { getSiteConfig } from "@/lib/site";
import { getPublishedBank } from "@/lib/study/published";
import { getPublishedTools } from "@/lib/learning-tools/published";

type Props = { params: Promise<{ id: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getResources().map(({ id }) => ({ id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resource = getResourceById((await params).id);
  return {
    title:
      (resource?.title ?? "Risorsa non trovata") + " | " + getSiteConfig().name,
    description: resource?.description,
  };
}
export default async function ResourcePage({ params }: Props) {
  const resource = getResourceById((await params).id);
  if (!resource) notFound();
  const subject = getSubjectBySlug(resource.subjectSlug);
  if (!subject) notFound();
  const { bank } = getPublishedBank(subject.slug),
    { tools } = getPublishedTools(subject.slug);
  return (
    <main id="contenuto" tabIndex={-1} className="page-container reader-page">
      <Link href={"/insegnamenti/" + subject.slug} className="breadcrumb-link">
        ← {subject.title}
      </Link>
      <header className="reader-header">
        <div>
          <h1 className="reader-title">{resource.title}</h1>
          <p className="mt-3 text-xs leading-6 text-muted">
            {resource.status} · {resource.pageCount} pagine
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={resource.fileUrl} download className="button-primary">
            <UiIcon name="download" />
            Scarica PDF
          </a>
          {(bank || tools.length > 0) && (
            <Link
              href={"/insegnamenti/" + subject.slug + "/studio"}
              className="button-secondary"
            >
              Vai al ripasso
            </Link>
          )}
        </div>
      </header>
      <details className="metadata-panel">
        <summary className="text-sm font-medium">
          Informazioni e provenienza
        </summary>
        <p className="mt-4 text-sm leading-7 text-muted">
          {resource.description}
        </p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="font-semibold">Autore</dt>
            <dd className="mt-1 text-muted">{resource.authors.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-semibold">Anno accademico</dt>
            <dd className="mt-1 text-muted">{resource.academicYear}</dd>
          </div>
          <div>
            <dt className="font-semibold">Versione dichiarata</dt>
            <dd className="mt-1 text-muted">
              {resource.version ?? "Non indicata"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Aggiornamento dichiarato</dt>
            <dd className="mt-1 text-muted">
              {resource.updatedAt ?? "Non indicato"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Provenienza</dt>
            <dd className="mt-1 leading-6 text-muted">{resource.provenance}</dd>
          </div>
          <div>
            <dt className="font-semibold">Revisione</dt>
            <dd className="mt-1 leading-6 text-muted">{resource.reviewNote}</dd>
          </div>
          <div>
            <dt className="font-semibold">File</dt>
            <dd className="mt-1 text-muted">
              PDF · {resource.pageCount} pagine ·{" "}
              {formatFileSize(resource.byteSize)}
            </dd>
          </div>
        </dl>
      </details>
      <PdfReader
        key={resource.id}
        url={resource.fileUrl}
        title={resource.title}
      />
    </main>
  );
}
