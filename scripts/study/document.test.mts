import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { buildSections, extractDocumentIndex } from "./document.mts";
import { DOCUMENT_VERSION, sectionVersion, validateDocumentIndex } from "../../src/lib/study/document.ts";
import { normalizeText } from "../../src/lib/study/schema.ts";
import { generateUploadedStudyKit } from "../../src/lib/study/web-core.ts";
import { buildEvidencePassages } from "./evidence.mts";
import type { Upload } from "../../src/lib/uploads/types.ts";
import type { StudyGenerator } from "./cloudflare.mts";

const bytes = await readFile(new URL("../../public/materials/machine-learning/appunti-machine-learning.pdf", import.meta.url));
const upload: Upload = { id: "11111111-1111-4111-8111-111111111111", owner_id: "22222222-2222-4222-8222-222222222222", subject_slug: "machine-learning", title: "Appunti test", author_name: "Autore test", original_name: "test.pdf", byte_size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), rights_confirmed: true, object_path: "test/test.pdf", status: "stored", created_at: "2026-11-09T12:00:00Z" };
const metadata = { resourceId: `upload-${upload.id}`, subjectSlug: upload.subject_slug, sourceSha256: upload.sha256 };
const index = await extractDocumentIndex(bytes, metadata);
const resources = JSON.parse(await readFile(new URL("../../src/content/resources.json", import.meta.url), "utf8")) as { id: string; pageCount: number }[];
const expectedPageCount = resources.find((r) => r.id === "appunti-machine-learning")!.pageCount;
const mock: StudyGenerator = async ({ pages }) => {
  const sourceId = buildEvidencePassages(pages)[0].sourceId;
  return { title: "Attività di test dalle fonti", summary: "Raccolta sintetica per verificare il funzionamento del generatore.",
    flashcards: Array.from({ length: 6 }, (_, i) => ({ front: `Domanda di test numero ${i + 1}?`, back: `Risposta di test numero ${i + 1}.`, sourceId })),
    quiz: Array.from({ length: 4 }, (_, i) => ({ question: `Quesito di test numero ${i + 1}?`, choices: ["Alternativa alfa", "Alternativa beta", "Alternativa gamma", "Alternativa delta"], correctIndex: i, explanation: `Spiegazione di test numero ${i + 1}.`, sourceId })) };
};

test("indice del PDF reale oltre pagina venti, ogni pagina indicizzata o esclusa esplicitamente", () => {
  assert.equal(index.pageCount, expectedPageCount);
  const pages = new Set([...index.skippedPages, ...index.sections.flatMap((s) => s.pages.map((p) => p.page))]);
  assert.deepEqual([...pages].sort((a, b) => a - b), Array.from({ length: expectedPageCount }, (_, i) => i + 1));
  assert.ok(index.sections.every((s) => s.title.length > 0));
});
test("stesso PDF e stessa procedura producono gli stessi identificativi di sezione", async () => {
  const second = await extractDocumentIndex(bytes, metadata);
  assert.deepEqual(second.sections.map((s) => s.id), index.sections.map((s) => s.id));
});
test("nessun troncamento su pagina densa e nessuna sezione oltre i limiti del modello", () => {
  const text = "Una frase verificabile sul documento. ".repeat(1800).trim();
  const split = buildSections([{ page: 1, text }]);
  assert.ok(split.sections.length > 1);
  assert.equal(normalizeText(split.sections.flatMap((s) => s.pages.map((p) => p.text)).join(" ")), normalizeText(text));
  for (const s of split.sections) assert.ok(s.pages.length <= 4 && s.pages.reduce((n, p) => n + p.text.length, 0) <= 18000);
  const repeated = buildSections([{ page: 1, text: "A".repeat(42000) }]);
  assert.equal(new Set(repeated.sections.map((s) => s.id)).size, repeated.sections.length);
  assert.doesNotThrow(() => validateDocumentIndex({ kind: "document-index", generatorVersion: DOCUMENT_VERSION, ...metadata, pageCount: 1, ...repeated }));
});
test("titoli brevi raggruppati senza perdere pagine; nessun titolo inventato senza segnalibri", () => {
  const pages = Array.from({ length: 8 }, (_, i) => ({ page: i + 1, text: "Informazione significativa. ".repeat(45) }));
  const grouped = buildSections(pages, pages.map((p) => ({ page: p.page, title: `Titolo ${p.page}` })));
  assert.ok(grouped.sections.every((s) => s.canGenerate));
  assert.equal(grouped.sections.flatMap((s) => s.pages).length, 8);
  assert.ok(buildSections(pages).sections.every((s) => /^Sezione \d+$/.test(s.title)));
});
test("copertura e sezioni duplicate vengono rifiutate all'apertura dell'indice", () => {
  assert.throws(() => validateDocumentIndex({ ...index, skippedPages: [...index.skippedPages, index.sections[0].pages[0].page] }));
  assert.throws(() => validateDocumentIndex({ ...index, sections: [...index.sections, index.sections[0]] }));
  assert.throws(() => validateDocumentIndex({ ...index, sections: [] }));
});
test("una sezione tarda usa soltanto le proprie fonti e una cache distinta", async () => {
  const section = index.sections.filter((s) => s.canGenerate).at(-1)!;
  let calls = 0;
  const kit = await generateUploadedStudyKit(upload, bytes, "Machine Learning", async (input) => {
    calls++; assert.deepEqual(input.pages, section.pages); return mock(input);
  }, section);
  assert.equal(calls, 1); assert.equal(kit.generatorVersion, sectionVersion(section));
  assert.deepEqual(kit.sourcePages, section.pages); assert.equal(kit.sourceSha256, upload.sha256);
  assert.ok(kit.flashcards.every((c) => section.pages.some((p) => p.page === c.page && p.text.includes(c.quote))));
  assert.notEqual(kit.generatorVersion, sectionVersion(index.sections[0]));
});
test("checksum errato rifiutato anche per una sezione già indicizzata, prima dell'AI", async () => {
  let calls = 0;
  await assert.rejects(generateUploadedStudyKit({ ...upload, sha256: "0".repeat(64) }, bytes, "Materia", async () => { calls++; }, index.sections[0]), { code: "source_mismatch" });
  assert.equal(calls, 0);
});

function blankPdf(pageCount: number): Uint8Array {
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Count ${pageCount} /Kids [${Array.from({ length: pageCount }, (_, i) => `${i + 3} 0 R`).join(" ")}] >>`, ...Array.from({ length: pageCount }, () => "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << >> >>")];
  let text = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((v, i) => { offsets.push(Buffer.byteLength(text)); text += `${i + 1} 0 obj\n${v}\nendobj\n`; });
  const xref = Buffer.byteLength(text);
  text += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map((v) => `${String(v).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(text));
}
test("documento oltre il limite rifiutato interamente; scansione vuota senza indice fittizio", async () => {
  await assert.rejects(extractDocumentIndex(blankPdf(251), metadata), /document_limit/);
  await assert.rejects(extractDocumentIndex(blankPdf(1), metadata), /source_unsupported/);
  assert.equal(index.generatorVersion, DOCUMENT_VERSION);
});
