import { createHash } from "node:crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { normalizeText, type SourcePage } from "../../src/lib/study/schema.ts";
import { DOCUMENT_VERSION, MAX_DOCUMENT_CHARACTERS, MAX_DOCUMENT_PAGES, validateDocumentIndex, type DocumentSection } from "../../src/lib/study/document.ts";

export type PdfHeading = { page: number; title: string };

export function buildSections(pages: SourcePage[], headings: PdfHeading[] = []) {
  const sections: DocumentSection[] = [], skippedPages: number[] = [];
  const ordered = [...headings].sort((a, b) => a.page - b.page);
  let current: SourcePage[] = [], characters = 0, currentHeading = "", lastHeading = "", part = 0;
  function flush() {
    if (!current.length) return;
    const id = "s-" + createHash("sha256").update(JSON.stringify({ order: sections.length, pages: current })).digest("hex").slice(0, 16);
    part++;
    sections.push({ id, title: currentHeading ? `${currentHeading.slice(0, 115)} · parte ${part}` : `Sezione ${sections.length + 1}`,
      pages: current, canGenerate: characters >= 1800 });
    current = []; characters = 0;
  }
  for (const p of pages) {
    const text = normalizeText(p.text);
    const toc = /^(?:indice|sommario|table of contents)\b/iu.test(text) || (p.text.match(/\.{3,}/gu)?.length ?? 0) >= 4;
    if (text.length < 300 || toc) { skippedPages.push(p.page); continue; }
    const heading = ordered.filter((h) => h.page <= p.page).at(-1)?.title ?? "";
    if (heading !== lastHeading) {
      if (characters >= 1800) flush();
      currentHeading = current.length ? [currentHeading, heading].filter(Boolean).join(" / ").slice(0, 115) : heading;
      lastHeading = heading; part = 0;
    }
    // Ogni carattere normalizzato delle pagine ammesse entra in una sezione.
    // Le pagine molto dense sono divise conservando il numero fisico originale.
    for (let offset = 0; offset < text.length;) {
      let end = Math.min(offset + 14000, text.length);
      if (text.length - end > 0 && text.length - end < 600) end = text.length;
      else if (end < text.length) {
        const boundary = text.lastIndexOf(". ", end);
        if (boundary > offset + 12000) end = boundary + 1;
      }
      const fragment = text.slice(offset, end);
      if (current.length === 4 || characters + fragment.length > 18000 || current.some((v) => v.page === p.page)) { flush(); currentHeading = heading; }
      current.push({ page: p.page, text: fragment }); characters += fragment.length;
      offset = end;
    }
  }
  flush();
  return { sections, skippedPages };
}

export async function extractDocumentContent(bytes: Uint8Array) {
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, verbosity: 0 });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > MAX_DOCUMENT_PAGES) throw new Error("document_limit");
    const headings: PdfHeading[] = [];
    const macroHeadings: PdfHeading[] = [];
    const outline = await pdf.getOutline();
    // I titoli provengono dai segnalibri del PDF, senza attribuzioni inventate.
    const nodes = (outline ?? []).map((node) => ({ node, depth: 0 })); let visited = 0;
    while (nodes.length && visited++ < 1000) {
      const { node, depth } = nodes.shift()!;
      nodes.push(...(node.items ?? []).map((child: typeof node) => ({ node: child, depth: depth + 1 })));
      try {
        const dest = typeof node.dest === "string" ? await pdf.getDestination(node.dest) : node.dest;
        if (!Array.isArray(dest) || dest[0] == null) continue;
        const page = typeof dest[0] === "number" ? dest[0] + 1 : await pdf.getPageIndex(dest[0]) + 1;
        const title = normalizeText(node.title).replace(/[\u0000-\u001f]/g, "").slice(0, 120);
        if (page >= 1 && page <= pdf.numPages && title && !headings.some((h) => h.page === page)) headings.push({ page, title });
        if (depth === 0 && page >= 1 && page <= pdf.numPages && title && !macroHeadings.some((h) => h.page === page)) macroHeadings.push({ page, title });
      } catch { /* Segnalibro malformato: resta disponibile la divisione per pagine. */ }
    }
    const pages: SourcePage[] = []; let characters = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      const text = content.items.map((item) => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join("");
      characters += text.length;
      if (characters > MAX_DOCUMENT_CHARACTERS) throw new Error("document_limit");
      pages.push({ page: n, text }); page.cleanup();
    }
    return { pageCount: pdf.numPages, pages, headings, macroHeadings: macroHeadings.sort((a, b) => a.page - b.page) };
  } finally { await task.destroy(); }
}

export async function extractDocumentIndex(bytes: Uint8Array, metadata: { resourceId: string; subjectSlug: string; sourceSha256: string }) {
  const content = await extractDocumentContent(bytes);
  const split = buildSections(content.pages, content.headings);
  if (!split.sections.length) throw new Error("source_unsupported");
  return validateDocumentIndex({ kind: "document-index", generatorVersion: DOCUMENT_VERSION, ...metadata, pageCount: content.pageCount, ...split });
}
