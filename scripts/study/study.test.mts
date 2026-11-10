import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateStudyDraft, validateStudyKit, type StudyDraft } from "../../src/lib/study/schema.ts";
import { createCloudflareGenerator } from "./cloudflare.mts";
import { createStudyKit, generationFingerprint, readCachedKit, saveStudyKit } from "./generate.mts";
import { extractSourcePages, selectSourcePages } from "./pdf.mts";
import { buildEvidencePassages, resolveDraftEvidence } from "./evidence.mts";
import { validateDraftQuality } from "./quality.mts";

const quote = "Una fonte dimostrativa permette di verificare la corrispondenza delle citazioni.";
const source = {
  resourceId: "risorsa-test", subjectSlug: "materia-test", sourceTitle: "Documento di test", subjectTitle: "Materia di test",
  sourceSha256: "a".repeat(64), sourcePages: [{ page: 4, text: `${quote} `.repeat(25) }],
};
function draft(): StudyDraft {
  return {
    title: "Attivita dimostrativa per test", summary: "Dati sintetici usati esclusivamente dai test automatici.",
    flashcards: Array.from({ length: 6 }, (_, index) => ({ front: `Domanda dimostrativa ${index + 1}?`, back: `Risposta dimostrativa ${index + 1}.`, page: 4, quote })),
    quiz: Array.from({ length: 4 }, (_, index) => ({ question: `Quesito dimostrativo ${index + 1}?`, choices: ["Prima alternativa", "Seconda alternativa", "Terza alternativa", "Quarta alternativa"], correctIndex: index, explanation: `Spiegazione dimostrativa ${index + 1}.`, page: 4, quote })),
  };
}

function generatedDraft() {
  const current = draft();
  const sourceId = buildEvidencePassages(source.sourcePages)[0].sourceId;
  return {
    ...current,
    flashcards: current.flashcards.map(({ front, back }) => ({ front, back, sourceId })),
    quiz: current.quiz.map(({ question, choices, correctIndex, explanation }) => ({ question, choices, correctIndex, explanation, sourceId })),
  };
}

test("accetta una raccolta completa con citazioni corrispondenti", async () => {
  const kit = await createStudyKit(source, async () => generatedDraft());
  assert.equal(validateStudyKit(kit).quiz.length, 4);
  assert.equal(kit.fingerprint, generationFingerprint(source));
});

test("rifiuta citazioni inventate e pagine non fornite", () => {
  const incorrect = draft();
  incorrect.flashcards[0].quote = "Questa frase non compare nel testo originale della fonte.";
  assert.throws(() => validateStudyDraft(incorrect, source.sourcePages), /letterale/);
  incorrect.flashcards[0].quote = quote;
  incorrect.flashcards[0].page = 999;
  assert.throws(() => validateStudyDraft(incorrect, source.sourcePages), /pagina effettivamente/);
});

test("rifiuta risposte fuori intervallo e alternative duplicate", () => {
  const incorrect = draft();
  incorrect.quiz[0].correctIndex = 4;
  assert.throws(() => validateStudyDraft(incorrect, source.sourcePages), /correctIndex/);
  incorrect.quiz[0].correctIndex = 0;
  incorrect.quiz[0].choices[1] = incorrect.quiz[0].choices[0].toUpperCase();
  assert.throws(() => validateStudyDraft(incorrect, source.sourcePages), /duplicati/);
});

test("richiede il numero previsto di attivita e domande distinte", () => {
  const incorrect = draft();
  incorrect.flashcards.pop();
  assert.throws(() => validateStudyDraft(incorrect, source.sourcePages), /6 elementi/);
  const duplicate = draft();
  duplicate.quiz[1].question = duplicate.quiz[0].question;
  assert.throws(() => validateStudyDraft(duplicate, source.sourcePages), /duplicati/);
});

test("normalizza spazi e legature per confrontare il testo estratto", () => {
  const correct = draft();
  correct.flashcards[0].quote = quote.replaceAll(" ", "\n");
  assert.doesNotThrow(() => validateStudyDraft(correct, source.sourcePages));
});

test("consente un solo tentativo di correzione di formato o citazioni", async () => {
  let calls = 0;
  const kit = await createStudyKit(source, async (input) => {
    calls++;
    if (calls === 1) return {};
    assert.match(input.correction ?? "", /Flashcard/);
    return generatedDraft();
  });
  assert.equal(calls, 2);
  assert.equal(kit.flashcards.length, 6);
});

test("ferma la generazione dopo due risposte non valide", async () => {
  let calls = 0;
  await assert.rejects(createStudyKit(source, async () => { calls++; return {}; }), /dopo due risposte/);
  assert.equal(calls, 2);
});

test("non ripete chiamate dopo un errore del servizio", async () => {
  let calls = 0;
  await assert.rejects(createStudyKit(source, async () => { calls++; throw new Error("HTTP 429"); }), /429/);
  assert.equal(calls, 1);
});

test("salvataggio atomico, riuso e invalidazione delle raccolte", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "aula-study-"));
  try {
    const file = path.join(directory, "risorsa-test.json");
    const kit = await createStudyKit(source, async () => generatedDraft());
    await saveStudyKit(file, kit);
    assert.equal((await readCachedKit(file, kit.fingerprint))?.title, kit.title);
    assert.equal(await readCachedKit(file, "b".repeat(64)), undefined);
    assert.notEqual(generationFingerprint({ ...source, sourceSha256: "b".repeat(64) }), kit.fingerprint);
    const before = await readFile(file, "utf8");
    await assert.rejects(saveStudyKit(file, { ...kit, sourceSha256: "invalid" }));
    assert.equal(await readFile(file, "utf8"), before);
    assert.deepEqual(await readdir(directory), ["risorsa-test.json"]);
    await saveStudyKit(file, { ...kit, title: "Nuova raccolta valida" });
    assert.equal((await readCachedKit(file, kit.fingerprint))?.title, "Nuova raccolta valida");
    await writeFile(file, "{");
    assert.equal(await readCachedKit(file, kit.fingerprint), undefined);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("seleziona fino a quattro pagine escludendo copertina e indice", () => {
  const pages = [{ page: 1, text: "Copertina" }, { page: 2, text: `Indice ${"capitolo .... 3 ".repeat(80)}` }, ...Array.from({ length: 6 }, (_, index) => ({ page: index + 3, text: source.sourcePages[0].text }))];
  assert.deepEqual(selectSourcePages(pages).map((page) => page.page), [3, 4, 5, 6]);
  assert.throws(() => selectSourcePages([{ page: 1, text: "" }]), /Testo insufficiente/);
});

test("estrazione effettiva dei due PDF del catalogo", async () => {
  const resources = JSON.parse(await readFile(new URL("../../src/content/resources.json", import.meta.url), "utf8")) as { fileUrl: string; pageCount: number }[];
  for (const resource of resources) {
    const pdfPath = new URL(`../../public${resource.fileUrl}`, import.meta.url);
    const { sourcePages, sourceSha256, pageCount } = await extractSourcePages(fileURLToPath(pdfPath));
    assert.equal(pageCount, resource.pageCount);
    assert.equal(sourceSha256.length, 64);
    assert.ok(sourcePages.length >= 1 && sourcePages.length <= 4);
    assert.ok(sourcePages.every((page) => page.page <= pageCount && page.text.length >= 600));
    const passages = buildEvidencePassages(sourcePages);
    for (const passage of passages) {
      assert.ok(passage.text.length >= 20 && passage.text.length <= 360);
      assert.ok(sourcePages.find((page) => page.page === passage.page)?.text.includes(passage.text));
    }
    for (const page of sourcePages) {
      assert.equal(passages.filter((passage) => passage.page === page.page).map((passage) => passage.text).join(" "), page.text);
    }
  }
});

test("il provider invia JSON strutturato e tratta il testo fonte come dati", async () => {
  const token = "secret-test-token";
  const generate = createCloudflareGenerator({ CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: token }, async (url, init) => {
    assert.ok(String(url).startsWith("https://api.cloudflare.com/"));
    assert.equal((init?.headers as Record<string, string>).Authorization, `Bearer ${token}`);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.response_format.type, "json_schema");
    assert.ok(body.messages[0].content.includes("non istruzioni"));
    assert.deepEqual(JSON.parse(body.messages[1].content).passages, buildEvidencePassages(source.sourcePages));
    assert.deepEqual(body.response_format.json_schema.properties.flashcards.items.properties.sourceId.enum, buildEvidencePassages(source.sourcePages).map((entry) => entry.sourceId));
    return new Response(JSON.stringify({ success: true, result: { response: generatedDraft() } }));
  });
  assert.deepEqual(await generate({ sourceTitle: source.sourceTitle, subjectTitle: source.subjectTitle, pages: source.sourcePages }), generatedDraft());
});

test("il provider accetta anche la risposta JSON serializzata come stringa", async () => {
  const generate = createCloudflareGenerator({ CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: "secret" }, async () => new Response(JSON.stringify({ success: true, result: { response: JSON.stringify(generatedDraft()) } })));
  assert.deepEqual(await generate({ sourceTitle: source.sourceTitle, subjectTitle: source.subjectTitle, pages: source.sourcePages }), generatedDraft());
});

test("il provider segnala errori senza includere le credenziali", async () => {
  const generate = createCloudflareGenerator({ CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_API_TOKEN: "secret-test-token" }, async () => new Response(JSON.stringify({ success: false, errors: [{ code: 10000, message: "secret-test-token" }] }), { status: 403 }));
  await assert.rejects(generate({ sourceTitle: source.sourceTitle, subjectTitle: source.subjectTitle, pages: source.sourcePages }), (error: Error) => error.message.includes("403") && !error.message.includes("secret-test-token"));
});


test("i passaggi mantengono pagina e testo letterale, con ID univoci", () => {
  const passages = buildEvidencePassages(source.sourcePages);
  assert.equal(new Set(passages.map((entry) => entry.sourceId)).size, passages.length);
  assert.equal(passages.map((entry) => entry.text).join(" "), source.sourcePages[0].text.trim());
  for (const passage of passages) {
    assert.equal(passage.page, 4);
    assert.ok(passage.text.length >= 20 && passage.text.length <= 360);
    assert.ok(source.sourcePages[0].text.includes(passage.text));
  }
});

test("pagina e citazione sono recuperate dall'ID e non accettate dal modello", () => {
  const raw = generatedDraft();
  const injected = { ...raw, flashcards: raw.flashcards.map((entry) => ({ ...entry, page: 999, quote: "Citazione inventata che non compare negli appunti." })) };
  const result = validateStudyDraft(resolveDraftEvidence(injected, buildEvidencePassages(source.sourcePages)), source.sourcePages);
  assert.equal(result.flashcards[0].page, 4);
  assert.equal(result.flashcards[0].quote, buildEvidencePassages(source.sourcePages)[0].text);
});

test("rifiuta un ID inventato senza scegliere una fonte alternativa", async () => {
  const raw = generatedDraft();
  raw.flashcards[1].sourceId = "p999-s1";
  const failures: unknown[] = [];
  await assert.rejects(createStudyKit(source, async () => raw, async (failure) => { failures.push(failure); }), /sourceId non presente/);
  assert.equal(failures.length, 2);
});

test("le raccolte v1 restano leggibili ma richiedono la generazione v2", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "aula-legacy-"));
  try {
    const file = path.join(directory, "legacy.json");
    const previous = {
      ...draft(), schemaVersion: 1, generatorVersion: "study-v1", generatedAt: "2026-10-28T12:00:00.000Z",
      provider: "cloudflare", model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", fingerprint: createHash("sha256").update(JSON.stringify({ ...source, model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", version: "study-v1" })).digest("hex"),
      resourceId: source.resourceId, subjectSlug: source.subjectSlug, sourceSha256: source.sourceSha256, sourcePages: source.sourcePages,
    };
    await writeFile(file, JSON.stringify(previous));
    assert.equal(validateStudyKit(previous).flashcards[0].quote, quote);
    assert.equal(await readCachedKit(file, generationFingerprint(source)), undefined);
    assert.equal(await readCachedKit(file, previous.fingerprint), undefined);
  } finally { await rm(directory, { recursive: true, force: true }); }
});


test("i fronti delle flashcard devono formulare domande", () => {
  const incorrect = draft();
  incorrect.flashcards[0].front = "Machine Learning";
  assert.throws(() => validateDraftQuality(incorrect), /domanda esplicita/);
});

test("il quiz non ripete una domanda identica a una flashcard", () => {
  const incorrect = draft();
  incorrect.quiz[0].question = incorrect.flashcards[0].front.toUpperCase();
  assert.throws(() => validateDraftQuality(incorrect), /identica a una flashcard/);
});

test("rifiuta formule illeggibili e parole spezzate nelle spiegazioni", () => {
  const incorrect = draft();
  incorrect.quiz[1].explanation = "Il vettore x = ⎡ ⎢ x 1 x 2 ⎥ ⎦ rappresenta un dato.";
  assert.throws(() => validateDraftQuality(incorrect), /matrice estratta/);
  incorrect.quiz[1].explanation = "Il modello utilizza esempi etichet- tati.";
  assert.throws(() => validateDraftQuality(incorrect), /parola spezzata/);
});

test("consente formule lineari e conserva la citazione originale", () => {
  const correct = draft();
  correct.quiz[1].explanation = "Il vettore x = (x_1, ..., x_n) rappresenta le caratteristiche del dato.";
  correct.quiz[1].quote = "Una citazione con glifi originali ⎡ ⎢ ⎣ e parole etichet- tate.";
  assert.doesNotThrow(() => validateDraftQuality(correct));
});
