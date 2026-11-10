import type { Metadata } from "next";
import Link from "next/link";
import { MaterialsExplorer } from "@/components/materials-explorer";
import { getSubjectBySlug, getSubjects } from "@/lib/catalog";
import { getResourceCategories, getResources } from "@/lib/catalog/resources";
import type { ResourceSearchItem } from "@/lib/catalog/search";
import { getSiteConfig } from "@/lib/site";
export const metadata: Metadata = {
  title: "Materiali | " + getSiteConfig().name,
  description:
    "Cerca i materiali di studio e filtra per insegnamento e categoria.",
};

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = (await searchParams).q;
  const initialQuery = (typeof query === "string" ? query : (query?.[0] ?? ""))
    .trim()
    .slice(0, 200);
  const categories = getResourceCategories();
  const items: readonly ResourceSearchItem[] = getResources().map(
    (resource) => {
      const subject = getSubjectBySlug(resource.subjectSlug),
        category = categories.find((entry) => entry.id === resource.categoryId);
      if (!subject || !category)
        throw new Error("Contesto mancante per la risorsa: " + resource.id);
      return {
        ...resource,
        subjectTitle: subject.title,
        categoryTitle: category.title,
      };
    },
  );
  return (
    <main id="contenuto" tabIndex={-1} className="page-container">
      <Link href="/" className="breadcrumb-link">
        ← Homepage
      </Link>
      <header className="editorial-header mb-8">
        <div>
          <p className="eyebrow">L’archivio di studio</p>
          <h1 className="page-title">
            Quello che cerchi, qui<span className="text-terracotta">.</span>
          </h1>
          <p className="page-description">
            Appunti e materiali, raccolti per materia.
          </p>
        </div>
      </header>
      <MaterialsExplorer
        key={initialQuery}
        initialQuery={initialQuery}
        items={items}
        subjects={getSubjects().map((subject) => ({
          value: subject.slug,
          label: subject.title,
        }))}
        categories={categories.map((category) => ({
          value: category.id,
          label: category.title,
        }))}
      />
    </main>
  );
}
