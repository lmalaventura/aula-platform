export const AUDIO_LIMIT = 10 * 1024 * 1024;
export type Origin = "human" | "ai-assisted" | "demo";
type Common = {
  title: string;
  summary: string;
  author: string;
  origin: Origin;
};
export type MapNode = {
  id: string;
  label: string;
  description: string;
  page: number;
};
export type MapLink = { from: string; to: string; label: string };
export type MapInput = Common & {
  kind: "map";
  nodes: MapNode[];
  links: MapLink[];
};
export type Chapter = {
  title: string;
  start: number;
  text: string;
  page: number;
};
export type PodcastInput = Common & {
  kind: "podcast";
  audioOrigin: "recorded" | "synthesized";
  chapters: Chapter[];
};
export type ToolInput = MapInput | PodcastInput;
export type ToolSource = {
  id: string;
  subjectSlug: string;
  title: string;
  fileUrl: string;
  pageCount: number;
  byteSize: number;
  sha256: string;
};
export type ToolDraft = {
  schemaVersion: 1;
  id: string;
  subjectSlug: string;
  source: ToolSource;
  input: ToolInput;
  savedAt: string;
  audio?: { sha256: string; ext: "mp3" | "wav" };
};
export type PublishedTool = ToolDraft & { reviewedAt: string };
export type DraftView = ToolDraft & {
  digest: string;
  published: boolean;
  stale: boolean;
};
export const validId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
  id.length <= 80;
const hex = (v: unknown): v is string =>
  typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
function obj(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Oggetto non valido.");
  return v as Record<string, unknown>;
}
function text(v: unknown, name: string, max: number) {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    throw new Error(`${name}: testo richiesto, massimo ${max} caratteri.`);
  return v.trim();
}
function page(v: unknown, pages: number) {
  if (!Number.isSafeInteger(v) || (v as number) < 1 || (v as number) > pages)
    throw new Error("Pagina fonte fuori dal PDF.");
  return v as number;
}
function list(v: unknown, min: number, max: number, name: string) {
  if (!Array.isArray(v) || v.length < min || v.length > max)
    throw new Error(`${name}: servono da ${min} a ${max} elementi.`);
  return v;
}
export function validateToolInput(raw: unknown, pageCount: number): ToolInput {
  const v = obj(raw);
  if (!["human", "ai-assisted", "demo"].includes(String(v.origin)))
    throw new Error("Indica la provenienza del contenuto.");
  const common: Common = {
    title: text(v.title, "Titolo", 140),
    summary: text(v.summary, "Descrizione", 1000),
    author: text(v.author, "Autore/redattore", 140),
    origin: v.origin as Origin,
  };
  if (v.kind === "map") {
    const nodes = list(v.nodes, 2, 12, "Concetti").map((value): MapNode => {
      const n = obj(value);
      if (!validId(n.id)) throw new Error("ID del concetto non valido.");
      return {
        id: n.id,
        label: text(n.label, "Nome concetto", 70),
        description: text(n.description, "Spiegazione", 2000),
        page: page(n.page, pageCount),
      };
    });
    const ids = new Set(nodes.map((n) => n.id));
    if (ids.size !== nodes.length)
      throw new Error("Concetti con ID duplicati.");
    const links = list(v.links, 1, 30, "Collegamenti").map((value): MapLink => {
      const e = obj(value);
      if (
        typeof e.from !== "string" ||
        typeof e.to !== "string" ||
        !ids.has(e.from) ||
        !ids.has(e.to) ||
        e.from === e.to
      )
        throw new Error("Collegamento senza due concetti distinti esistenti.");
      return { from: e.from, to: e.to, label: text(e.label, "Relazione", 100) };
    });
    if (
      new Set(links.map((e) => `${e.from}\u0000${e.to}\u0000${e.label}`))
        .size !== links.length
    )
      throw new Error("Collegamenti duplicati.");
    if (nodes.some((n) => !links.some((e) => e.from === n.id || e.to === n.id)))
      throw new Error("Ogni concetto deve avere almeno un collegamento.");
    return { ...common, kind: "map", nodes, links };
  }
  if (v.kind === "podcast") {
    if (!["recorded", "synthesized"].includes(String(v.audioOrigin)))
      throw new Error("Indica se l'audio è registrato o sintetizzato.");
    const chapters = list(v.chapters, 1, 40, "Capitoli").map(
      (value): Chapter => {
        const c = obj(value);
        if (
          typeof c.start !== "number" ||
          !Number.isFinite(c.start) ||
          c.start < 0 ||
          c.start > 86400
        )
          throw new Error("Posizione audio non valida: usare secondi da zero.");
        return {
          title: text(c.title, "Titolo capitolo", 140),
          start: c.start,
          text: text(c.text, "Trascrizione", 12000),
          page: page(c.page, pageCount),
        };
      },
    );
    if (
      chapters[0].start !== 0 ||
      chapters.some((c, i) => i > 0 && c.start <= chapters[i - 1].start)
    )
      throw new Error(
        "Il primo capitolo parte da zero; i successivi devono avere tempi crescenti.",
      );
    if (chapters.reduce((n, c) => n + c.text.length, 0) > 60000)
      throw new Error(
        "Trascrizione troppo lunga: massimo 60.000 caratteri per episodio.",
      );
    return {
      ...common,
      kind: "podcast",
      audioOrigin: v.audioOrigin as PodcastInput["audioOrigin"],
      chapters,
    };
  }
  throw new Error("Tipo di strumento non riconosciuto.");
}
export function validateTool(
  raw: unknown,
  published = false,
): ToolDraft | PublishedTool {
  const v = obj(raw),
    s = obj(v.source);
  if (
    v.schemaVersion !== 1 ||
    !validId(v.id) ||
    !validId(v.subjectSlug) ||
    !validId(s.id) ||
    s.subjectSlug !== v.subjectSlug ||
    !hex(s.sha256) ||
    !Number.isSafeInteger(s.pageCount) ||
    (s.pageCount as number) < 1 ||
    (s.pageCount as number) > 250 ||
    !Number.isSafeInteger(s.byteSize) ||
    (s.byteSize as number) < 1 ||
    typeof s.fileUrl !== "string" ||
    !/^\/materials\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(s.fileUrl)
  )
    throw new Error("Fonte o identità dello strumento non valida.");
  const source: ToolSource = {
    id: s.id,
    subjectSlug: v.subjectSlug,
    title: text(s.title, "Titolo fonte", 300),
    fileUrl: s.fileUrl,
    pageCount: s.pageCount as number,
    byteSize: s.byteSize as number,
    sha256: s.sha256,
  };
  if (typeof v.savedAt !== "string" || !Number.isFinite(Date.parse(v.savedAt)))
    throw new Error("Data bozza non valida.");
  const input = validateToolInput(v.input, source.pageCount);
  const result: ToolDraft = {
    schemaVersion: 1,
    id: v.id,
    subjectSlug: v.subjectSlug,
    source,
    input,
    savedAt: v.savedAt,
  };
  if (input.kind === "podcast") {
    const audio = obj(v.audio);
    if (!hex(audio.sha256) || !["mp3", "wav"].includes(String(audio.ext)))
      throw new Error("Audio non valido.");
    result.audio = { sha256: audio.sha256, ext: audio.ext as "mp3" | "wav" };
  }
  if (published) {
    if (input.origin === "demo")
      throw new Error(
        "Le demo tecniche non sono pubblicabili come materiale di studio.",
      );
    if (
      typeof v.reviewedAt !== "string" ||
      !Number.isFinite(Date.parse(v.reviewedAt))
    )
      throw new Error("Revisione mancante.");
    return { ...result, reviewedAt: v.reviewedAt };
  }
  return result;
}
export function audioUrl(
  subject: string,
  audio: NonNullable<ToolDraft["audio"]>,
) {
  if (
    !validId(subject) ||
    !hex(audio.sha256) ||
    !["mp3", "wav"].includes(audio.ext)
  )
    throw new Error("Percorso audio non valido.");
  return `/media/study/${subject}/${audio.sha256}.${audio.ext}`;
}
