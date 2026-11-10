import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceCard } from "@/components/resource-card";
import { StudyEntrance } from "@/components/study-entrance";
import { getSubjectBySlug, getSubjects } from "@/lib/catalog";
import {
  getResourceCategories,
  getResourcesForSubject,
} from "@/lib/catalog/resources";
import { getSiteConfig } from "@/lib/site";
import { getCanonicalResource, getPublishedBank } from "@/lib/study/published";
import { getPublishedTools } from "@/lib/learning-tools/published";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getSubjects().map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = getSubjectBySlug((await params).slug);
  return {
    title:
      (subject?.title ?? "Materia non trovata") + " | " + getSiteConfig().name,
    description: subject?.description,
  };
}
export default async function SubjectPage({ params }: Props) {
  const { slug } = await params,
    subject = getSubjectBySlug(slug);
  if (!subject) notFound();
  const primary = getCanonicalResource(slug),
    { bank } = getPublishedBank(slug),
    { tools } = getPublishedTools(slug);
  const resources = getResourcesForSubject(slug).filter(
    (r) => r.id !== primary?.id && r.categoryId !== "appunti",
  );
  const groups = getResourceCategories()
    .map((category) => ({
      category,
      resources: resources.filter((r) => r.categoryId === category.id),
    }))
    .filter((g) => g.resources.length);
  const available = [
    bank ? "Quiz, flashcard e allenamento" : null,
    tools.some((t) => t.input.kind === "map") ? "Mappe concettuali" : null,
    tools.some((t) => t.input.kind === "podcast") ? "Podcast" : null,
  ].filter(Boolean);
  return (
    <main id="contenuto" tabIndex={-1} className="page-container">
      <nav aria-label="Percorso di navigazione">
        <Link href="/insegnamenti" className="breadcrumb-link">
          ← Insegnamenti
        </Link>
      </nav>
      <header className="editorial-header subject-header">
        <div>
          <p className="eyebrow">{getSiteConfig().programme}</p>
          <h1 className="page-title">{subject.title}</h1>
          <p className="page-description">{subject.description}</p>
        </div>
        <span className="subject-header-label" aria-hidden="true">
          {subject.label}
        </span>
      </header>
      <div className="subject-layout">
        <section aria-labelledby="notes-title">
          <h2 id="notes-title" className="mb-5 text-2xl">
            Da qui si comincia
          </h2>
          {primary ? (
            <ResourceCard resource={primary} headingLevel={3} featured />
          ) : (
            <p className="empty-panel">
              Gli appunti condivisi sono in preparazione.
            </p>
          )}
        </section>
        <aside aria-labelledby="study-title" className="study-invitation">
          <p className="eyebrow">Un altro modo di studiare</p>
          <h2 id="study-title" className="mt-3 text-3xl">
            Facciamo un ripasso?
          </h2>
          <StudyEntrance
            compact
            href={"/insegnamenti/" + slug + "/studio"}
            preparing={!available.length}
          />
          <p className="study-availability">
            {available.length
              ? available.join(" · ")
              : "Strumenti in preparazione. Intanto puoi leggere gli appunti."}
          </p>
        </aside>
      </div>
      {groups.length > 0 && (
        <section aria-labelledby="other-title" className="mt-12">
          <h2 id="other-title" className="text-3xl">
            Per andare oltre
          </h2>
          <div className="mt-6 space-y-8">
            {groups.map(({ category, resources }) => (
              <section
                key={category.id}
                aria-labelledby={"category-" + category.id}
              >
                <h3
                  id={"category-" + category.id}
                  className="mb-4 text-lg font-semibold"
                >
                  {category.title}
                </h3>
                <div className="grid gap-5 md:grid-cols-2">
                  {resources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
