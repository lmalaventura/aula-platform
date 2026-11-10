import type { Flashcard, QuizQuestion } from "./schema.ts";

export type BankCard = Flashcard & { id: string; topicId: string };
export type BankQuestion = QuizQuestion & { id: string; topicId: string };
export type StudyBank = {
  schemaVersion: 1;
  subjectSlug: string;
  sourceId: string;
  sourceSha256: string;
  publishedAt: string;
  reviewedAt: string;
  sourceUrl: string;
  sourceTitle: string;
  topics: { id: string; title: string }[];
  flashcards: BankCard[];
  quiz: BankQuestion[];
  coveredUnits: number;
  availableUnits: number;
};

export function validateBank(value: unknown): StudyBank {
  const x = value as StudyBank;
  if (
    !x ||
    x.schemaVersion !== 1 ||
    !/^[a-z0-9-]+$/.test(x.subjectSlug) ||
    !/^[a-z0-9-]+$/.test(x.sourceId) ||
    !/^[a-f0-9]{64}$/.test(x.sourceSha256) ||
    !/^\/materials\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(x.sourceUrl) ||
    typeof x.sourceTitle !== "string" ||
    !x.sourceTitle.trim() ||
    !Number.isFinite(Date.parse(x.publishedAt)) ||
    !Number.isFinite(Date.parse(x.reviewedAt)) ||
    !Number.isSafeInteger(x.coveredUnits) ||
    !Number.isSafeInteger(x.availableUnits) ||
    x.coveredUnits < 1 ||
    x.coveredUnits > x.availableUnits ||
    !Array.isArray(x.topics) ||
    !x.topics.length ||
    !Array.isArray(x.flashcards) ||
    !Array.isArray(x.quiz) ||
    !x.quiz.length ||
    !x.flashcards.length
  )
    throw new Error("Banca di studio non valida.");
  const topics = new Set<string>();
  for (const t of x.topics) {
    if (
      !/^t-[a-f0-9]{16}$/.test(t.id) ||
      typeof t.title !== "string" ||
      !t.title.trim() ||
      t.title.length > 160 ||
      topics.has(t.id)
    )
      throw new Error("Macroargomenti non validi.");
    topics.add(t.id);
  }
  const ids = new Set<string>();
  for (const item of [...x.flashcards, ...x.quiz]) {
    if (
      !/^[fq]-[a-f0-9]{16}$/.test(item.id) ||
      ids.has(item.id) ||
      !topics.has(item.topicId) ||
      !Number.isSafeInteger(item.page) ||
      item.page < 1 ||
      typeof item.quote !== "string" ||
      item.quote.length < 20 ||
      item.quote.length > 360
    )
      throw new Error("Attività non valida.");
    ids.add(item.id);
    const strings =
      "front" in item
        ? [item.front, item.back]
        : [item.question, item.explanation, ...item.choices];
    if (
      strings.some((s) => typeof s !== "string" || !s.trim() || s.length > 1600)
    )
      throw new Error("Testo attività non valido.");
    if (
      "choices" in item &&
      (item.choices.length !== 4 ||
        new Set(item.choices).size !== 4 ||
        !Number.isSafeInteger(item.correctIndex) ||
        item.correctIndex < 0 ||
        item.correctIndex > 3)
    )
      throw new Error("Quesito non valido.");
  }
  return x;
}

export function selectBank(bank: StudyBank, topicId: string) {
  return {
    flashcards: bank.flashcards.filter(
      (q) => !topicId || q.topicId === topicId,
    ),
    quiz: bank.quiz.filter((q) => !topicId || q.topicId === topicId),
  };
}
