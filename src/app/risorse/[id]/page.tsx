import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubjectBySlug } from "@/lib/catalog";
import { formatFileSize } from "@/lib/catalog/format";
import { getResourceById, getResources } from "@/lib/catalog/resources";
import { getSiteConfig } from "@/lib/site";

type ResourcePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getResources().map((resource) => ({ id: resource.id }));
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { id } = await params;
  const resource = getResourceById(id);
  const site = getSiteConfig();
  return {
    title: `${resource?.title ?? "Risorsa non trovata"} | ${site.name}`,
    description: resource?.description ?? site.description,
  };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { id } = await params;
  const resource = getResourceById(id);
  if (!resource) notFound();
  const subject = getSubjectBySlug(resource.subjectSlug);
  if (!subject) notFound();

  return (
    <main id="contenuto" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
      <Link href={`/insegnamenti/${subject.slug}`} className="inline-flex min-h-12 items-center text-sm font-medium text-accent hover:underline">
        ← Torna a {subject.title}
      </Link>
      <header className="mt-5">
        <h1 className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{resource.title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{resource.status} · {resource.pageCount} pagine</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={resource.fileUrl} download className="inline-flex min-h-12 items-center rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-accent">
            Scarica PDF
          </a>
          <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-accent hover:border-accent">
            Apri PDF in una nuova scheda
          </a>
        </div>
      </header>
      <details className="mt-6 rounded-xl border border-border bg-white p-5">
        <summary className="cursor-pointer font-medium">Informazioni e provenienza</summary>
        <p className="mt-4 text-sm leading-7 text-muted">{resource.description}</p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold">Autore</dt><dd className="mt-1 text-muted">{resource.authors.join(", ")}</dd></div>
          <div><dt className="font-semibold">Anno accademico</dt><dd className="mt-1 text-muted">{resource.academicYear}</dd></div>
          <div><dt className="font-semibold">Versione dichiarata</dt><dd className="mt-1 text-muted">{resource.version ?? "Non indicata"}</dd></div>
          <div><dt className="font-semibold">Data di aggiornamento dichiarata</dt><dd className="mt-1 text-muted">{resource.updatedAt ?? "Non indicata"}</dd></div>
          <div><dt className="font-semibold">Provenienza</dt><dd className="mt-1 leading-6 text-muted">{resource.provenance}</dd></div>
          <div><dt className="font-semibold">Revisione</dt><dd className="mt-1 leading-6 text-muted">{resource.reviewNote}</dd></div>
          <div><dt className="font-semibold">File</dt><dd className="mt-1 text-muted">PDF · {resource.pageCount} pagine · {formatFileSize(resource.byteSize)}</dd></div>
        </dl>
      </details>
      <section aria-labelledby="preview-title" className="mt-8">
        <h2 id="preview-title" className="sr-only">Lettura del documento</h2>
        <p className="mb-3 text-sm leading-7 text-muted">
          Se il documento non viene visualizzato correttamente, usa il collegamento per aprire il PDF in una nuova scheda oppure scaricalo.
        </p>
        <object data={resource.fileUrl} type="application/pdf" aria-label={`Anteprima PDF: ${resource.title}`} className="block h-[75dvh] min-h-[420px] w-full rounded-xl border border-border bg-white">
          <p className="p-6 text-sm leading-7 text-muted">
            Anteprima non disponibile in questo browser. <a href={resource.fileUrl} className="font-semibold text-accent underline">Apri direttamente il PDF</a>.
          </p>
        </object>
      </section>
    </main>
  );
}
