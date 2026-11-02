import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { normalizeText, validateSourcePages, type SourcePage } from "../../src/lib/study/schema.ts";

export function selectSourcePages(pages: SourcePage[]): SourcePage[] {
  const selected: SourcePage[] = [];
  let characters = 0;
  for (const source of pages) {
    const normalized = normalizeText(source.text);
    const toc = /^(?:indice|sommario|table of contents)\b/iu.test(normalized) ||
      (source.text.match(/\.{3,}/gu)?.length ?? 0) >= 4;
    if (toc || normalized.length < 600) continue;
    if (characters + normalized.length > 18000) break;
    selected.push({ page: source.page, text: normalized });
    characters += normalized.length;
    if (selected.length === 4) break;
  }
  if (selected.length === 0 || characters < 1800) {
    throw new Error("Testo insufficiente: questo primo estrattore richiede un PDF testuale, non una scansione. Nessuna chiamata AI eseguita.");
  }
  return validateSourcePages(selected);
}

export async function extractSourcePages(filePath: string) {
  const bytes = await readFile(filePath);
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    verbosity: 0,
  });
  try {
    const document = await task.promise;
    const pages: SourcePage[] = [];
    // La prova copre l'inizio del documento. Il limite evita elaborazioni enormi.
    for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 20); pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join("");
      pages.push({ page: pageNumber, text });
      page.cleanup();
    }
    return { sourcePages: selectSourcePages(pages), sourceSha256, pageCount: document.numPages };
  } finally {
    await task.destroy();
  }
}
