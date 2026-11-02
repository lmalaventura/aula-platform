import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { generateUploadedStudyKit } from "../../src/lib/study/web-core.ts";
import { jobExpired } from "../../src/lib/study/web-types.ts";
import { buildEvidencePassages } from "./evidence.mts";
import type { StudyGenerator } from "./cloudflare.mts";
import type { Upload } from "../../src/lib/uploads/types.ts";

const path = fileURLToPath(new URL("../../public/materials/machine-learning/appunti-machine-learning.pdf", import.meta.url));
const bytes = await readFile(path);
const upload: Upload = {
  id: "11111111-1111-4111-8111-111111111111", owner_id: "22222222-2222-4222-8222-222222222222",
  subject_slug: "machine-learning", title: "Appunti di test", author_name: "Autore Test", original_name: "appunti.pdf",
  byte_size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), rights_confirmed: true,
  object_path: "test/appunti.pdf", status: "stored", created_at: "2026-11-02T12:00:00Z",
};
const mock: StudyGenerator = async ({ pages }) => {
  const sourceId = buildEvidencePassages(pages)[0].sourceId;
  return {
    title: "Raccolta sintetica di test", summary: "Contenuto di test, non utilizzabile come materiale didattico.",
    flashcards: Array.from({ length: 6 }, (_, i) => ({ front: `Domanda di test ${i + 1}?`, back: `Risposta di test ${i + 1}.`, sourceId })),
    quiz: Array.from({ length: 4 }, (_, i) => ({ question: `Quesito di test ${i + 1}?`, choices: ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"], correctIndex: i, explanation: `Spiegazione di test ${i + 1}.`, sourceId })),
  };
};

test("generazione da byte PDF reali, stesso formato e controlli del generatore CLI", async () => {
  let calls = 0;
  const kit = await generateUploadedStudyKit(upload, bytes, "Machine Learning", async (input) => { calls++; return mock(input); });
  assert.equal(calls, 1); assert.equal(kit.resourceId, `upload-${upload.id}`);
  assert.equal(kit.sourceSha256, upload.sha256); assert.equal(kit.flashcards.length, 6); assert.equal(kit.quiz.length, 4);
  assert.deepEqual(kit.sourcePages.map((p) => p.page), [4, 6, 7, 8]);
});
test("hash diverso rifiutato prima di inviare testo al modello", async () => {
  let calls = 0;
  await assert.rejects(generateUploadedStudyKit({ ...upload, sha256: "0".repeat(64) }, bytes, "Materia", async () => { calls++; }), { code: "source_mismatch" });
  assert.equal(calls, 0);
});
test("dimensione o intestazione diverse rifiutate prima del provider", async () => {
  await assert.rejects(generateUploadedStudyKit({ ...upload, byte_size: 9 }, bytes, "Materia", mock), { code: "source_mismatch" });
  const invalid = Buffer.from("File non PDF");
  await assert.rejects(generateUploadedStudyKit({ ...upload, byte_size: invalid.length, sha256: createHash("sha256").update(invalid).digest("hex") }, invalid, "Materia", mock), { code: "source_mismatch" });
});
test("PDF danneggiato distinto dagli errori del modello, zero chiamate AI", async () => {
  const damaged = Buffer.from("%PDF-1.7\nFile di test privo di oggetti e pagine"); let calls = 0;
  await assert.rejects(generateUploadedStudyKit({ ...upload, byte_size: damaged.length, sha256: createHash("sha256").update(damaged).digest("hex") }, damaged, "Materia", async () => { calls++; }), { code: "source_unsupported" });
  assert.equal(calls, 0);
});
test("quota provider gestita senza retry automatico", async () => {
  let calls = 0;
  await assert.rejects(generateUploadedStudyKit(upload, bytes, "Materia", async () => { calls++; throw new Error("Cloudflare: HTTP 429, quota"); }), { code: "provider_quota" });
  assert.equal(calls, 1);
});
test("output senza fonti rifiutato dopo massimo due risposte", async () => {
  let calls = 0;
  await assert.rejects(generateUploadedStudyKit(upload, bytes, "Materia", async () => { calls++; return {}; }), { code: "invalid_output" });
  assert.equal(calls, 2);
});
test("elaborazioni scadute: stato recuperabile dopo sei minuti", () => {
  const job = { id: "test", upload_id: upload.id, owner_id: upload.owner_id, status: "processing" as const, generator_version: "study-v2", started_at: "2026-11-02T12:00:00Z", finished_at: null, error_code: null };
  const start = Date.parse(job.started_at);
  assert.equal(jobExpired(job, start + 359_000), false);
  assert.equal(jobExpired(job, start + 361_000), true);
  assert.equal(jobExpired({ ...job, status: "ready" }, start + 361_000), false);
});
