"use client";

import { useState } from "react";
import { ResourceCard } from "@/components/resource-card";
import { filterResources } from "@/lib/catalog/search";
import type { FilterOption, ResourceFilters, ResourceSearchItem } from "@/lib/catalog/search";

type MaterialsExplorerProps = {
  items: readonly ResourceSearchItem[];
  subjects: readonly FilterOption[];
  categories: readonly FilterOption[];
};

const emptyFilters: ResourceFilters = {
  query: "",
  subjectSlug: "",
  categoryId: "",
};

export function MaterialsExplorer({ items, subjects, categories }: MaterialsExplorerProps) {
  const [filters, setFilters] = useState<ResourceFilters>(emptyFilters);
  const results = filterResources(items, filters);
  const hasFilters = Boolean(filters.query || filters.subjectSlug || filters.categoryId);
  const resultLabel = results.length === 1 ? "1 materiale trovato" : `${results.length} materiali trovati`;

  return (
    <>
      <noscript>
        <p className="mb-6 rounded-xl border border-border bg-white p-5 text-sm leading-7">
          Ricerca e filtri richiedono JavaScript. Puoi comunque consultare e scaricare i materiali elencati.
        </p>
      </noscript>
      <form
        role="search"
        aria-label="Ricerca e filtri dei materiali"
        onSubmit={(event) => event.preventDefault()}
        className="rounded-2xl border border-border bg-white p-5 sm:p-7"
      >
        <div className="grid items-end gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <label htmlFor="materials-query" className="block text-sm font-semibold">Cerca nei materiali</label>
            <input
              id="materials-query"
              type="search"
              name="q"
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              placeholder="Es. NumPy, Flutter, autore…"
              aria-describedby="materials-search-help"
              aria-controls="materials-results"
              className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground placeholder:text-muted"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="materials-subject" className="block text-sm font-semibold">Insegnamento</label>
            <select
              id="materials-subject"
              name="subject"
              value={filters.subjectSlug}
              onChange={(event) => setFilters({ ...filters, subjectSlug: event.target.value })}
              aria-controls="materials-results"
              className="mt-2 min-h-12 w-full min-w-0 truncate rounded-xl border border-border bg-white px-3 py-3 text-base text-foreground"
            >
              <option value="">Tutti gli insegnamenti</option>
              {subjects.map((subject) => <option key={subject.value} value={subject.value}>{subject.label}</option>)}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="materials-category" className="block text-sm font-semibold">Categoria</label>
            <select
              id="materials-category"
              name="category"
              value={filters.categoryId}
              onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}
              aria-controls="materials-results"
              className="mt-2 min-h-12 w-full min-w-0 truncate rounded-xl border border-border bg-white px-3 py-3 text-base text-foreground"
            >
              <option value="">Tutte le categorie</option>
              {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </div>
          <button
            type="button"
            disabled={!hasFilters}
            onClick={() => setFilters(emptyFilters)}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold text-accent enabled:hover:border-accent disabled:cursor-default disabled:text-muted disabled:opacity-60"
          >
            Azzera filtri
          </button>
        </div>
        <p id="materials-search-help" className="mt-4 text-sm leading-7 text-muted">
          Cerca in titolo, descrizione, autore, categoria e insegnamento. I risultati si aggiornano mentre scrivi.
        </p>
      </form>
      <section id="materials-results" aria-labelledby="materials-results-title" className="mt-9">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="materials-results-title" className="text-2xl font-semibold tracking-tight">Risultati</h2>
          <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-muted">{resultLabel}</p>
        </div>
        {results.length > 0 ? (
          <ul className="mt-5 grid gap-5 lg:grid-cols-2">
            {results.map((item) => (
              <li key={item.id} className="min-w-0">
                <ResourceCard
                  resource={item}
                  headingLevel={3}
                  contextLabel={`${item.subjectTitle} · ${item.categoryTitle}`}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-white p-7 sm:p-9">
            <h3 className="text-lg font-semibold">
              {items.length === 0 ? "Non sono ancora presenti materiali" : "Nessun materiale corrisponde alla ricerca"}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {items.length === 0
                ? "Le risorse disponibili saranno raccolte in questa pagina."
                : "Prova parole diverse o usa Azzera filtri per vedere tutti i materiali."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
