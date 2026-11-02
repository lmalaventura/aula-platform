export const STUDY_VERSION = "study-v2";
export const STUDY_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const FLASHCARD_COUNT = 6;
export const QUIZ_COUNT = 4;

export type SourcePage = { page: number; text: string };
export type Evidence = { page: number; quote: string };
export type Flashcard = Evidence & { front: string; back: string };
export type QuizQuestion = Evidence & {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};
export type StudyDraft = {
  title: string;
  summary: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
};
export type StudyKit = StudyDraft & {
  schemaVersion: 1;
  generatorVersion: string;
  generatedAt: string;
  provider: "cloudflare";
  model: string;
  fingerprint: string;
  resourceId: string;
  subjectSlug: string;
  sourceSha256: string;
  sourcePages: SourcePage[];
};

export function normalizeText(text: string): string {
  return text.normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}: oggetto mancante o non valido.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max = 1600, min = 3): string {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) {
    throw new Error(`${label}: testo mancante o lunghezza non valida.`);
  }
  return value.trim();
}

function array(value: unknown, count: number, label: string): unknown[] {
  if (!Array.isArray(value) || value.length !== count) {
    throw new Error(`${label}: sono richiesti ${count} elementi.`);
  }
  return value;
}

function evidence(value: Record<string, unknown>, pages: SourcePage[], label: string): Evidence {
  const page = value.page;
  const source = pages.find((entry) => entry.page === page);
  if (typeof page !== "number" || !Number.isSafeInteger(page) || !source) {
    throw new Error(`${label}: cita una pagina effettivamente fornita.`);
  }
  const quote = text(value.quote, `${label}, citazione`, 360, 20);
  if (!normalizeText(source.text).includes(normalizeText(quote))) {
    throw new Error(`${label}: la citazione deve essere un passaggio letterale della pagina ${page}.`);
  }
  return { page, quote };
}

function unique(values: string[], label: string) {
  const normalized = values.map((value) => normalizeText(value).toLocaleLowerCase("it"));
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${label}: elementi duplicati.`);
  }
}

export function validateSourcePages(value: unknown): SourcePage[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4) {
    throw new Error("Fonti: occorrono da una a quattro pagine.");
  }
  const pages = value.map((entry) => {
    const source = record(entry, "Pagina fonte");
    if (!Number.isSafeInteger(source.page) || Number(source.page) < 1) {
      throw new Error("Numero di pagina fonte non valido.");
    }
    return { page: Number(source.page), text: text(source.text, "Testo fonte", 18000, 300) };
  });
  if (new Set(pages.map((source) => source.page)).size !== pages.length ||
      pages.reduce((sum, source) => sum + source.text.length, 0) > 18000) {
    throw new Error("Fonti duplicate o limite di 18.000 caratteri superato.");
  }
  return pages;
}

export function validateStudyDraft(value: unknown, sourcePages: SourcePage[]): StudyDraft {
  const draft = record(value, "Attivita");
  const flashcards = array(draft.flashcards, FLASHCARD_COUNT, "Flashcard").map((entry, index) => {
    const card = record(entry, `Flashcard ${index + 1}`);
    return {
      front: text(card.front, "Domanda flashcard", 500),
      back: text(card.back, "Risposta flashcard", 1400),
      ...evidence(card, sourcePages, `Flashcard ${index + 1}`),
    };
  });
  const quiz = array(draft.quiz, QUIZ_COUNT, "Quiz").map((entry, index) => {
    const question = record(entry, `Quesito ${index + 1}`);
    const choices = array(question.choices, 4, "Alternative").map((choice) => text(choice, "Alternativa", 500));
    unique(choices, "Alternative");
    if (!Number.isSafeInteger(question.correctIndex) || Number(question.correctIndex) < 0 || Number(question.correctIndex) > 3) {
      throw new Error(`Quesito ${index + 1}: correctIndex deve essere un intero da 0 a 3.`);
    }
    return {
      question: text(question.question, "Domanda quiz", 800),
      choices,
      correctIndex: Number(question.correctIndex),
      explanation: text(question.explanation, "Spiegazione", 1600),
      ...evidence(question, sourcePages, `Quesito ${index + 1}`),
    };
  });
  unique(flashcards.map((card) => card.front), "Flashcard");
  unique(quiz.map((question) => question.question), "Quesiti");
  return {
    title: text(draft.title, "Titolo", 160),
    summary: text(draft.summary, "Descrizione", 600),
    flashcards,
    quiz,
  };
}

export function validateStudyKit(value: unknown): StudyKit {
  const kit = record(value, "Raccolta");
  if (kit.schemaVersion !== 1 || kit.provider !== "cloudflare") throw new Error("Formato raccolta non supportato.");
  const sourcePages = validateSourcePages(kit.sourcePages);
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const resourceId = text(kit.resourceId, "ID risorsa", 160);
  const subjectSlug = text(kit.subjectSlug, "Materia", 160);
  if (!slugPattern.test(resourceId) || !slugPattern.test(subjectSlug)) throw new Error("ID raccolta non valido.");
  const sourceSha256 = text(kit.sourceSha256, "Impronta PDF", 64);
  const fingerprint = text(kit.fingerprint, "Impronta generazione", 64);
  if (!/^[a-f0-9]{64}$/.test(sourceSha256) || !/^[a-f0-9]{64}$/.test(fingerprint)) throw new Error("Impronta non valida.");
  const generatedAt = text(kit.generatedAt, "Data generazione", 40);
  if (!/^\d{4}-\d\d-\d\dT/.test(generatedAt) || !Number.isFinite(Date.parse(generatedAt))) throw new Error("Data non valida.");
  return {
    ...validateStudyDraft(kit, sourcePages),
    schemaVersion: 1,
    generatorVersion: text(kit.generatorVersion, "Versione generatore", 80),
    generatedAt,
    provider: "cloudflare",
    model: text(kit.model, "Modello", 160),
    fingerprint,
    resourceId,
    subjectSlug,
    sourceSha256,
    sourcePages,
  };
}
