import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceCard } from "@/components/resource-card";
import { getSubjectBySlug, getSubjects } from "@/lib/catalog";
import { getResourceCategories, getResourcesForSubject } from "@/lib/catalog/resources";
import { getSiteConfig } from "@/lib/site";

type SubjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getSubjects().map((subject) => ({ slug: subject.slug }));
}

export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const subject = getSubjectBySlug(slug);
  const site = getSiteConfig();
  return {
    title: `${subject?.title ?? "Insegnamento non trovato"} | ${site.name}`,
    description: subject?.description ?? site.description,
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { slug } = await params;
  const subject = getSubjectBySlug(slug);
  if (!subject) notFound();

  const site = getSiteConfig();
  const resources = getResourcesForSubject(slug);
  const groups = getResourceCategories()
    .map((category) => ({
      category,
      resources: resources.filter((resource) => resource.categoryId === category.id),
    }))
    .filter((group) => group.resources.length > 0);

  return (
    <main id="contenuto" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <nav aria-label="Percorso di navigazione">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <li>
            <Link href="/insegnamenti" className="inline-flex min-h-12 items-center font-medium text-accent hover:underline">
              Insegnamenti
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted">/</li>
          <li aria-current="page" className="text-muted">{subject.title}</li>
        </ol>
      </nav>
      <header className="mt-7 rounded-3xl bg-ink p-7 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">{site.programme}</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{subject.title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">{subject.description}</p>
      </header>
      <section aria-labelledby="materials-title" className="mt-10">
        <h2 id="materials-title" className="text-2xl font-semibold tracking-tight">Materiali di studio</h2>
        {resources.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-white p-8 text-muted">
            Non sono ancora disponibili materiali per questa materia.
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            {groups.map(({ category, resources: categoryResources }) => (
              <section key={category.id} aria-labelledby={`category-${category.id}`}>
                <h3 id={`category-${category.id}`} className="mb-4 text-lg font-semibold">{category.title}</h3>
                <div className="space-y-4">
                  {categoryResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
