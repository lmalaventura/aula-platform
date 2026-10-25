import type { Metadata } from "next";
import Link from "next/link";
import { MaterialsExplorer } from "@/components/materials-explorer";
import { getSubjectBySlug, getSubjects } from "@/lib/catalog";
import { getResourceCategories, getResources } from "@/lib/catalog/resources";
import type { ResourceSearchItem } from "@/lib/catalog/search";
import { getSiteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Materiali | ${getSiteConfig().name}`,
  description: "Cerca i materiali di studio e filtra per insegnamento e categoria.",
};

export default function MaterialsPage() {
  const site = getSiteConfig();
  const categories = getResourceCategories();
  const items: readonly ResourceSearchItem[] = getResources().map((resource) => {
    const subject = getSubjectBySlug(resource.subjectSlug);
    const category = categories.find((entry) => entry.id === resource.categoryId);
    if (!subject || !category) {
      throw new Error(`Contesto mancante per la risorsa: ${resource.id}`);
    }
    return { ...resource, subjectTitle: subject.title, categoryTitle: category.title };
  });

  return (
    <main id="contenuto" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link href="/" className="inline-flex min-h-12 items-center text-sm font-medium text-accent hover:underline">
        ← Torna alla homepage
      </Link>
      <header className="mt-7 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">{site.programme}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Materiali</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
          Tutte le risorse di studio in un solo posto. Trova un documento oppure restringi la ricerca alla tua materia.
        </p>
      </header>
      <MaterialsExplorer
        items={items}
        subjects={getSubjects().map((subject) => ({ value: subject.slug, label: subject.title }))}
        categories={categories.map((category) => ({ value: category.id, label: category.title }))}
      />
    </main>
  );
}
