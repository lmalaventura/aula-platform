import type { Metadata } from "next";
import Link from "next/link";
import { SubjectCard } from "@/components/subject-card";
import { SubjectSearch } from "@/components/subject-search";
import { BrandIllustration } from "@/components/brand-illustration";
import { getSubjects } from "@/lib/catalog";
import { searchSubjects, subjectQuery } from "@/lib/catalog/subject-search";
import { getSiteConfig } from "@/lib/site";
export const metadata: Metadata = {
  title: "Insegnamenti | " + getSiteConfig().name,
};
export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = subjectQuery((await searchParams).q),
    subjects = getSubjects(),
    found = searchSubjects(subjects, query);
  return (
    <main id="contenuto" tabIndex={-1} className="page-container">
      <Link href="/" className="breadcrumb-link">
        ← Homepage
      </Link>
      <header className="editorial-header">
        <div>
          <p className="eyebrow">{getSiteConfig().programme}</p>
          <h1 className="page-title">
            Scegli la tua materia<span className="text-terracotta">.</span>
          </h1>
          <p className="page-description">
            Apri il quaderno. Al resto pensiamo insieme.
          </p>
        </div>
        <div className="mascot-peek">
          <BrandIllustration />
        </div>
      </header>
      <div className="catalog-search">
        <SubjectSearch key={query} subjects={subjects} initialQuery={query} />
      </div>
      <section aria-labelledby="catalog-title" className="mt-8">
        <h2 id="catalog-title" className="sr-only">
          Elenco degli insegnamenti
        </h2>
        {query && (
          <p className="mb-5 text-sm text-muted">Risultati per “{query}”</p>
        )}
        {found.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {found.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} />
            ))}
          </div>
        ) : (
          <div className="empty-study">
            <BrandIllustration kind="hanging" />
            <div>
              <h2 className="text-2xl">Qui non abbiamo trovato una materia.</h2>
              <p className="mt-3 leading-7 text-muted">
                Prova un altro nome oppure riparti dal catalogo.
              </p>
              <Link href="/insegnamenti" className="button-secondary mt-4">
                Vedi tutte le materie
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
