import type { Metadata } from "next";
import Link from "next/link";
import { SubjectCard } from "@/components/subject-card";
import { getSubjects } from "@/lib/catalog";
import { getSiteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Insegnamenti | ${getSiteConfig().name}`,
};

export default function SubjectsPage() {
  const site = getSiteConfig();
  const subjects = getSubjects();

  return (
    <main
      id="contenuto"
      tabIndex={-1}
      className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14"
    >
      <Link
        href="/"
        className="inline-flex min-h-12 items-center text-sm font-medium text-accent hover:underline"
      >
        ← Torna alla homepage
      </Link>

      <p className="mt-7 text-xs font-semibold uppercase tracking-widest text-accent">
        {site.institution}
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Insegnamenti
      </h1>

      <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
        {site.programme}. Scegli una materia per accedere al suo spazio di
        studio.
      </p>

      <section aria-labelledby="catalog-title" className="mt-9">
        <h2 id="catalog-title" className="sr-only">
          Elenco degli insegnamenti
        </h2>

        {subjects.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {subjects.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-border bg-white p-8 text-muted">
            Non sono ancora presenti insegnamenti.
          </p>
        )}
      </section>
    </main>
  );
}