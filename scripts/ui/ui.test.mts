import assert from "node:assert/strict";
import { test } from "node:test";
import {
  searchSubjects,
  subjectSearchDestination,
  subjectQuery,
} from "../../src/lib/catalog/subject-search.ts";
import { studyChoices } from "../../src/lib/study/modes.ts";
import { practiceDemoBank } from "../../src/lib/study/practice-demo.ts";
import type { PublishedTool } from "../../src/lib/learning-tools/schema.ts";
const subjects = [
  { slug: "machine-learning", title: "Machine Learning", label: "ML" },
  {
    slug: "dispositivi-mobili",
    title: "Programmazione di dispositivi mobili e interfacce utente",
    label: "UI",
  },
  { slug: "matematica", title: "Matematica applicata", label: "MA" },
  { slug: "economia", title: "Èconomia e società", label: "ECO" },
];
test("ricerca per prefisso di parola: Ma non abbina programmazione e conserva le corrispondenze", () => {
  assert.deepEqual(
    searchSubjects(subjects, "Ma").map((s) => s.slug),
    ["machine-learning", "matematica"],
  );
  assert.deepEqual(
    searchSubjects(subjects, "mobi").map((s) => s.slug),
    ["dispositivi-mobili"],
  );
});
test("accenti, maiuscole, sigle e termini multipli usano lo stesso catalogo", () => {
  assert.equal(searchSubjects(subjects, "ECONOMIA")[0].slug, "economia");
  assert.equal(searchSubjects(subjects, "ml")[0].slug, "machine-learning");
  assert.equal(
    searchSubjects(subjects, "LEARN mach")[0].slug,
    "machine-learning",
  );
  assert.equal(
    searchSubjects(subjects, " interfacce   mobi ")[0].slug,
    "dispositivi-mobili",
  );
});
test("ricerca vuota e sconosciuta: catalogo completo o nessun risultato, senza modificare i dati", () => {
  const copy = structuredClone(subjects);
  assert.deepEqual(searchSubjects(subjects, " "), subjects);
  assert.deepEqual(searchSubjects(subjects, "sconosciuta"), []);
  assert.deepEqual(searchSubjects(subjects, "!!!"), []);
  assert.deepEqual(subjects, copy);
});
test("invio: materia unica diretta, piu risultati al catalogo, ricerca vuota al catalogo completo", () => {
  assert.equal(
    subjectSearchDestination(subjects, "machine"),
    "/insegnamenti/machine-learning",
  );
  assert.equal(subjectSearchDestination(subjects, "ma"), "/insegnamenti?q=ma");
  assert.equal(subjectSearchDestination(subjects, ""), "/insegnamenti");
  assert.equal(
    subjectSearchDestination(subjects, "inesistente"),
    "/insegnamenti?q=inesistente",
  );
});
test("query URL: primo valore, limite e codifica senza percorsi esterni", () => {
  assert.equal(subjectQuery(["  ma  ", "altro"]), "ma");
  assert.equal(subjectQuery(undefined), "");
  assert.equal(subjectQuery("x".repeat(400)).length, 200);
  assert.equal(
    subjectSearchDestination(subjects, "<script>&?"),
    "/insegnamenti?q=%3Cscript%3E%26%3F",
  );
});
test("nessuna banca e nessuno strumento: nessuna opzione di studio fittizia", () => {
  assert.deepEqual(studyChoices(null, []), []);
});
test("quiz, flashcard e allenamento sono accessi distinti derivati dalla banca", () => {
  assert.deepEqual(
    studyChoices(practiceDemoBank, []).map((c) => c.id),
    ["quiz", "cards", "exam"],
  );
  const onlyCards = { ...practiceDemoBank, quiz: [] };
  assert.deepEqual(
    studyChoices(onlyCards, []).map((c) => c.id),
    ["cards"],
  );
});
test("mappe e podcast compaiono soltanto con il relativo contenuto, senza duplicare le opzioni", () => {
  const map = { input: { kind: "map" } } as PublishedTool,
    podcast = { input: { kind: "podcast" } } as PublishedTool;
  assert.deepEqual(
    studyChoices(null, [map, map]).map((c) => c.id),
    ["map"],
  );
  assert.deepEqual(
    studyChoices(null, [podcast, map]).map((c) => c.id),
    ["map", "podcast"],
  );
  assert.equal(studyChoices(practiceDemoBank, [map, podcast]).length, 5);
});
test("nuova materia: stesso selettore di studio e stessa logica di ricerca senza codice specifico", () => {
  const other = {
    ...practiceDemoBank,
    subjectSlug: "sicurezza-informatica",
    subjectTitle: "Sicurezza informatica",
  };
  assert.deepEqual(studyChoices(other, []), studyChoices(practiceDemoBank, []));
  const catalog = [
    ...subjects,
    {
      slug: "sicurezza-informatica",
      title: "Sicurezza informatica",
      label: "SI",
    },
  ];
  assert.equal(
    subjectSearchDestination(catalog, "sicurez"),
    "/insegnamenti/sicurezza-informatica",
  );
});
