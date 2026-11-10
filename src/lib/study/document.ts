import { STUDY_VERSION, validateSourcePages, type SourcePage } from "./schema.ts";

export const DOCUMENT_VERSION = "document-index-v1";
export const MAX_DOCUMENT_PAGES = 250;
export const MAX_DOCUMENT_CHARACTERS = 1_000_000;

export type DocumentSection = { id: string; title: string; pages: SourcePage[]; canGenerate: boolean };
export type DocumentIndex = {
  kind: "document-index"; generatorVersion: typeof DOCUMENT_VERSION;
  resourceId: string; subjectSlug: string; sourceSha256: string;
  pageCount: number; skippedPages: number[]; sections: DocumentSection[];
};
export function sectionVersion(section: Pick<DocumentSection, "id">): string {
  return `${STUDY_VERSION}-${section.id}`;
}
export function sectionPages(section: DocumentSection): string {
  return section.pages.map((p) => p.page).join(", ");
}
export function validateDocumentIndex(value: unknown): DocumentIndex {
  if (!value || typeof value !== "object") throw new Error("Indice non valido.");
  const x = value as DocumentIndex;
  if (x.kind !== "document-index" || x.generatorVersion !== DOCUMENT_VERSION ||
      !/^upload-[a-f0-9-]{36}$/.test(x.resourceId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.subjectSlug) ||
      !/^[a-f0-9]{64}$/.test(x.sourceSha256) || !Number.isSafeInteger(x.pageCount) || x.pageCount < 1 || x.pageCount > MAX_DOCUMENT_PAGES ||
      !Array.isArray(x.sections) || !x.sections.length || x.sections.length > 512 || !Array.isArray(x.skippedPages)) throw new Error("Indice non valido.");
  const sections = x.sections.map((s): DocumentSection => {
    if (!s || !/^s-[a-f0-9]{16}$/.test(s.id) || typeof s.title !== "string" || !s.title.trim() || s.title.length > 160) throw new Error("Sezione non valida.");
    const pages = validateSourcePages(s.pages);
    if (pages.some((p) => p.page > x.pageCount)) throw new Error("Pagina oltre il documento.");
    return { id: s.id, title: s.title, pages, canGenerate: pages.reduce((n, p) => n + p.text.length, 0) >= 1800 };
  });
  const covered = new Set(sections.flatMap((s) => s.pages.map((p) => p.page)));
  if (new Set(sections.map((s) => s.id)).size !== sections.length ||
      sections.reduce((n, s) => n + s.pages.reduce((m, p) => m + p.text.length, 0), 0) > MAX_DOCUMENT_CHARACTERS ||
      new Set(x.skippedPages).size !== x.skippedPages.length ||
      x.skippedPages.some((p) => !Number.isSafeInteger(p) || p < 1 || p > x.pageCount || covered.has(p)) ||
      covered.size + x.skippedPages.length !== x.pageCount) throw new Error("Copertura indice incoerente.");
  return { kind: "document-index", generatorVersion: DOCUMENT_VERSION, resourceId: x.resourceId,
    subjectSlug: x.subjectSlug, sourceSha256: x.sourceSha256, pageCount: x.pageCount, skippedPages: [...x.skippedPages], sections };
}
