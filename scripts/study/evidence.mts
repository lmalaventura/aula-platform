import { normalizeText, validateSourcePages, type SourcePage } from "../../src/lib/study/schema.ts";

export type EvidencePassage = { sourceId: string; page: number; text: string };

// I passaggi vengono estratti dal programma. Il modello ne seleziona l'ID;
// pagina e citazione pubblicate vengono sempre copiate dal testo originale.
export function buildEvidencePassages(pages: SourcePage[]): EvidencePassage[] {
  return validateSourcePages(pages).flatMap((source) => {
    const text = normalizeText(source.text);
    const sentenceEnds = [...new Intl.Segmenter("it", { granularity: "sentence" }).segment(text)]
      .map((sentence) => sentence.index + sentence.segment.length);
    const passages: string[] = [];
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + 320, text.length);
      if (end < text.length) {
        const sentenceEnd = sentenceEnds.filter((boundary) => boundary > start + 80 && boundary <= end).at(-1);
        const boundary = text.lastIndexOf(" ", end);
        if (sentenceEnd !== undefined) end = sentenceEnd;
        else if (boundary > start + 160) end = boundary;
        // Non separare una coppia UTF-16 quando manca uno spazio utile.
        else if (/[\uD800-\uDBFF]/u.test(text[end - 1])) end--;
      }
      const part = text.slice(start, end).trim();
      if (part.length < 20 && passages.length) passages[passages.length - 1] += ` ${part}`;
      else passages.push(part);
      start = end;
      while (text[start] === " ") start++;
    }
    return passages.map((part, index) => ({ sourceId: `p${source.page}-s${index + 1}`, page: source.page, text: part }));
  });
}

export function resolveDraftEvidence(value: unknown, passages: EvidencePassage[]): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Attivita: oggetto mancante.");
  const draft = value as Record<string, unknown>;
  const byId = new Map(passages.map((passage) => [passage.sourceId, passage]));
  function resolve(items: unknown, label: string) {
    if (!Array.isArray(items)) throw new Error(`${label}: elenco mancante.`);
    return items.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`${label} ${index + 1}: oggetto non valido.`);
      const entry = item as Record<string, unknown>;
      const passage = typeof entry.sourceId === "string" ? byId.get(entry.sourceId) : undefined;
      if (!passage) throw new Error(`${label} ${index + 1}: sourceId non presente nei passaggi forniti. Scegli un ID esistente.`);
      // Qualunque page/quote restituito dal modello viene ignorato.
      return { ...entry, page: passage.page, quote: passage.text };
    });
  }
  return { ...draft, flashcards: resolve(draft.flashcards, "Flashcard"), quiz: resolve(draft.quiz, "Quesito") };
}
