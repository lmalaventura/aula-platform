import { normalizeText, type StudyDraft } from "../../src/lib/study/schema.ts";

function comparable(text: string) {
  return normalizeText(text).toLocaleLowerCase("it").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

// Controlli riproducibili di forma e leggibilita, non una verifica disciplinare.
// Le citazioni originali sono escluse: devono restare fedeli al PDF.
export function validateDraftQuality(draft: StudyDraft): void {
  const issues: string[] = [];
  const flashQuestions = new Set(draft.flashcards.map((card) => comparable(card.front)));
  const checkText = (text: string, label: string) => {
    if (/[\u23A1-\u23A6]/u.test(text)) issues.push(`${label}: matrice estratta dal PDF illeggibile. Riscrivi la formula in testo lineare, per esempio x = (x_1, ..., x_n), se supportata dalla fonte.`);
    if (/\p{L}{3,}-\s+\p{Ll}{2,}/u.test(text)) issues.push(`${label}: parola spezzata dall'impaginazione PDF. Scrivi normalmente le parole nella spiegazione.`);
  };
  checkText(draft.title, "Titolo");
  checkText(draft.summary, "Descrizione");
  draft.flashcards.forEach((card, index) => {
    if (!card.front.endsWith("?")) issues.push(`Flashcard ${index + 1}: il fronte deve essere una domanda esplicita, non soltanto il nome dell'argomento.`);
    checkText(card.front, `Flashcard ${index + 1}, domanda`);
    checkText(card.back, `Flashcard ${index + 1}, risposta`);
  });
  draft.quiz.forEach((question, index) => {
    if (flashQuestions.has(comparable(question.question))) issues.push(`Quiz ${index + 1}: domanda identica a una flashcard. Verifica lo stesso argomento con un quesito diverso, preferibilmente applicativo.`);
    checkText(question.question, `Quiz ${index + 1}, domanda`);
    checkText(question.explanation, `Quiz ${index + 1}, spiegazione`);
    question.choices.forEach((choice, choiceIndex) => checkText(choice, `Quiz ${index + 1}, alternativa ${choiceIndex + 1}`));
  });
  if (issues.length) throw new Error(`Controlli di leggibilita non superati: ${issues.join(" ")}`);
}
