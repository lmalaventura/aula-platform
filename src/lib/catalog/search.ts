import type { StudyResource } from "./resource-types";

export type ResourceSearchItem = StudyResource & Readonly<{
  subjectTitle: string;
  categoryTitle: string;
}>;

export type ResourceFilters = Readonly<{
  query: string;
  subjectSlug: string;
  categoryId: string;
}>;

export type FilterOption = Readonly<{
  value: string;
  label: string;
}>;

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function filterResources(
  items: readonly ResourceSearchItem[],
  filters: ResourceFilters,
): readonly ResourceSearchItem[] {
  const terms = normalizeText(filters.query).trim().split(/\s+/).filter(Boolean);

  return items.filter((item) => {
    if (filters.subjectSlug && item.subjectSlug !== filters.subjectSlug) return false;
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;

    const searchableText = normalizeText([
      item.title,
      item.description,
      ...item.authors,
      item.subjectTitle,
      item.categoryTitle,
      item.academicYear,
    ].join(" "));

    return terms.every((term) => searchableText.includes(term));
  });
}
