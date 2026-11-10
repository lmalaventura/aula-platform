import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSections, extractDocumentContent } from "../study/document.mts";
import { createStudyKit, generationFingerprint } from "../study/generate.mts";
import type { StudyGenerator } from "../study/cloudflare.mts";
import {
  STUDY_MODEL,
  STUDY_VERSION,
  normalizeText,
  validateStudyKit,
  type SourcePage,
  type StudyKit,
} from "../../src/lib/study/schema.ts";
import { validateBank, type StudyBank } from "../../src/lib/study/bank.ts";

export const projectRoot = process.cwd();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export type CanonicalSource = {
  id: string;
  subjectSlug: string;
  title: string;
  fileUrl: string;
  pageCount: number;
  byteSize: number;
  subjectTitle: string;
  sha256: string;
};
export type DraftUnit = {
  id: string;
  title: string;
  topicId: string;
  contentKey: string;
  pages: number[];
  state: "pending" | "ready" | "failed" | "insufficient";
};
export type DraftManifest = {
  subjectSlug: string;
  source: CanonicalSource;
  topics: { id: string; title: string }[];
  units: DraftUnit[];
  skippedPages: number[];
};
export type Review = {
  decision: "approved" | "excluded" | "pending";
  digest: string;
  reviewedAt: string;
};
export type EditorUnit = DraftUnit & { kit?: StudyKit; review?: Review };
export type EditorDraft = Omit<DraftManifest, "units"> & {
  units: EditorUnit[];
  stale: boolean;
};
const hash = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
function preparationServiceDetail(error: unknown): string | undefined {
  if (!(error instanceof Error)) return;
  const http = /^Cloudflare: HTTP (\d{3})(?:, codici (-?\d+(?:, -?\d+)*))?/.exec(error.message);
  if (http) {
    const codes = http[2]?.split(", ").slice(0, 8).join(", ");
    return `Cloudflare: HTTP ${http[1]}${codes ? `, codici ${codes}` : ""}.`;
  }
  const nonJson = /^Cloudflare: risposta non JSON \(HTTP (\d{3})\)/.exec(error.message);
  if (nonJson) return `Cloudflare: risposta non JSON (HTTP ${nonJson[1]}).`;
  if (error.message === "Cloudflare: risposta generata mancante.")
    return "Cloudflare: risposta generata mancante.";
  if (error.message.startsWith("Controlla CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN"))
    return "Controlla CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN in .env.local.";
  if (["TimeoutError", "AbortError"].includes(error.name) || /attesa/i.test(error.message))
    return "Cloudflare: richiesta interrotta o scaduta.";
  if (/fetch failed/i.test(error.message)) {
    const cause = error.cause;
    const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
    const known = [
      "ENOTFOUND", "EAI_AGAIN", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT",
      "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT",
      "CERT_HAS_EXPIRED", "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
      "DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    ];
    return `Cloudflare: connessione non riuscita${typeof code === "string" && known.includes(code) ? ` (${code})` : ""}.`;
  }
}
const folder = (slug: string, root = projectRoot) => {
  if (!slugPattern.test(slug)) throw new Error("Insegnamento non valido.");
  return path.join(root, ".aula/editor", slug);
};
export async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}
export async function atomicJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", {
    flag: "wx",
  });
  await rename(temporary, file);
}
export function contentKey(pages: SourcePage[]) {
  return hash({ pages, model: STUDY_MODEL, version: STUDY_VERSION });
}
export function reviewDigest(kit: StudyKit) {
  return hash({
    flashcards: kit.flashcards,
    quiz: kit.quiz,
    pages: kit.sourcePages,
    model: kit.model,
    version: STUDY_VERSION,
  });
}

export async function canonicalSource(
  slug: string,
  root = projectRoot,
): Promise<CanonicalSource> {
  folder(slug, root);
  const sources = await readJson<{ subjectSlug: string; resourceId: string }[]>(
    path.join(root, "src/content/study-sources.json"),
  );
  const resources = await readJson<
    Omit<CanonicalSource, "subjectTitle" | "sha256">[]
  >(path.join(root, "src/content/resources.json"));
  const subjects = await readJson<{ slug: string; title: string }[]>(
    path.join(root, "src/content/subjects.json"),
  );
  const assigned = sources?.filter((s) => s.subjectSlug === slug) ?? [];
  const source = resources?.find(
    (r) => r.id === assigned[0]?.resourceId && r.subjectSlug === slug,
  );
  const subject = subjects?.find((s) => s.slug === slug);
  if (
    assigned.length !== 1 ||
    !source ||
    !subject ||
    !/^\/materials\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(source.fileUrl)
  )
    throw new Error(
      "Configura una sola fonte principale per insegnamento in study-sources.json.",
    );
  const bytes = await readFile(
    path.join(root, "public", source.fileUrl.slice(1)),
  );
  if (bytes.length !== source.byteSize)
    throw new Error(
      "Metadati PDF da aggiornare: esegui npm.cmd run content:sync.",
    );
  return {
    ...source,
    subjectTitle: subject.title,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export async function prepareDraft(
  slug: string,
  generate: StudyGenerator,
  options: {
    root?: string;
    dryRun?: boolean;
    maxUnits?: number;
    force?: boolean;
    onProgress?: (line: string) => void;
  } = {},
) {
  const root = options.root ?? projectRoot,
    source = await canonicalSource(slug, root),
    directory = folder(slug, root);
  const bytes = await readFile(
    path.join(root, "public", source.fileUrl.slice(1)),
  );
  const doc = await extractDocumentContent(bytes);
  if (doc.pageCount !== source.pageCount)
    throw new Error("Numero di pagine cambiato: esegui content:sync.");
  const headings = doc.macroHeadings.length
    ? doc.macroHeadings
    : [{ page: 1, title: "Argomenti del documento" }];
  const manifest: DraftManifest = {
    subjectSlug: slug,
    source,
    topics: [],
    units: [],
    skippedPages: [],
  };
  const planned: { unit: DraftUnit; pages: SourcePage[] }[] = [];
  headings.forEach((heading, i) => {
    const start = i === 0 ? 1 : heading.page,
      end = headings[i + 1]?.page ?? doc.pageCount + 1;
    const pages = doc.pages.filter((p) => p.page >= start && p.page < end);
    const split = buildSections(pages, doc.headings);
    const occurrence = headings
      .slice(0, i)
      .filter((h) => h.title === heading.title).length;
    const topicId = `t-${hash({ title: heading.title, occurrence }).slice(0, 16)}`;
    manifest.topics.push({ id: topicId, title: heading.title });
    manifest.skippedPages.push(...split.skippedPages);
    for (const s of split.sections) {
      const unit: DraftUnit = {
        id: s.id,
        title: s.title,
        topicId,
        pages: s.pages.map((p) => p.page),
        contentKey: contentKey(s.pages),
        state: s.canGenerate ? "pending" : "insufficient",
      };
      manifest.units.push(unit);
      planned.push({ unit, pages: s.pages });
    }
  });
  if (!manifest.units.length)
    throw new Error(
      "Nessun testo utilizzabile nel PDF. Le scansioni richiedono OCR.",
    );
  if (options.dryRun) return manifest;
  await atomicJson(path.join(directory, "manifest.json"), manifest);
  let generated = 0;
  for (const { unit, pages } of planned) {
    if (unit.state === "insufficient") continue;
    const file = path.join(directory, "kits", unit.contentKey + ".json");
    const input = {
      resourceId: source.id,
      subjectSlug: slug,
      sourceTitle: source.title,
      subjectTitle: source.subjectTitle,
      sourceSha256: source.sha256,
      sourcePages: pages,
    };
    const cached = options.force ? null : await readJson<StudyKit>(file);
    if (cached) {
      const valid = validateStudyKit(cached);
      if (
        contentKey(valid.sourcePages) !== unit.contentKey ||
        valid.model !== STUDY_MODEL
      )
        throw new Error("Cache non coerente con le fonti.");
      await atomicJson(file, {
        ...valid,
        resourceId: source.id,
        subjectSlug: slug,
        sourceSha256: source.sha256,
        fingerprint: generationFingerprint(input),
      });
      unit.state = "ready";
      options.onProgress?.(`Riutilizzata: ${unit.title}`);
    } else if (generated < (options.maxUnits ?? 100)) {
      options.onProgress?.(`Preparazione: ${unit.title}`);
      generated++;
      try {
        await atomicJson(file, await createStudyKit(input, generate));
        unit.state = "ready";
      } catch (error) {
        unit.state = "failed";
        await atomicJson(path.join(directory, "manifest.json"), manifest);
        const detail = preparationServiceDetail(error);
        if (detail)
          throw new Error(
            `${detail}\nPreparazione interrotta, senza nuovi tentativi automatici. Le raccolte già completate sono conservate. Ripeti lo stesso comando dopo aver risolto la causa; non eliminare .aula/editor.`,
          );
        options.onProgress?.(
          `Risposta rifiutata per ${unit.title}. Puoi riprovare con lo stesso comando.`,
        );
      }
    }
    await atomicJson(path.join(directory, "manifest.json"), manifest);
  }
  return manifest;
}

export async function loadDraft(
  slug: string,
  root = projectRoot,
): Promise<EditorDraft | null> {
  const directory = folder(slug, root),
    manifest = await readJson<DraftManifest>(
      path.join(directory, "manifest.json"),
    );
  if (!manifest) return null;
  const source = await canonicalSource(slug, root);
  const names =
    (await readJson<Record<string, string>>(
      path.join(directory, "topic-names.json"),
    )) ?? {};
  const units = await Promise.all(
    manifest.units.map(async (unit): Promise<EditorUnit> => {
      const raw = await readJson<StudyKit>(
        path.join(directory, "kits", unit.contentKey + ".json"),
      );
      if (!raw || unit.state !== "ready") return unit;
      const kit = validateStudyKit(raw);
      if (
        contentKey(kit.sourcePages) !== unit.contentKey ||
        kit.resourceId !== manifest.source.id ||
        kit.sourceSha256 !== manifest.source.sha256 ||
        kit.subjectSlug !== slug
      )
        throw new Error(
          "Bozza non coerente con il documento. Ripeti study:prepare.",
        );
      const review = await readJson<Review>(
        path.join(directory, "reviews", unit.contentKey + ".json"),
      );
      return {
        ...unit,
        state: "ready",
        kit,
        ...(review?.digest === reviewDigest(kit) ? { review } : {}),
      };
    }),
  );
  return {
    ...manifest,
    topics: manifest.topics.map((t) => ({
      ...t,
      title: names[t.id] ?? t.title,
    })),
    units,
    stale:
      source.sha256 !== manifest.source.sha256 ||
      source.id !== manifest.source.id,
  };
}

export async function reviewUnit(
  slug: string,
  id: string,
  decision: Review["decision"],
  digest: string,
  root = projectRoot,
) {
  if (!["approved", "excluded", "pending"].includes(decision))
    throw new Error("Decisione non valida.");
  const draft = await loadDraft(slug, root),
    unit = draft?.units.find((u) => u.id === id);
  if (!draft || draft.stale || !unit?.kit || digest !== reviewDigest(unit.kit))
    throw new Error(
      "La bozza è cambiata: aggiorna la pagina prima di confermare.",
    );
  await atomicJson(
    path.join(folder(slug, root), "reviews", unit.contentKey + ".json"),
    { decision, digest, reviewedAt: new Date().toISOString() },
  );
}
export async function renameTopic(
  slug: string,
  id: string,
  title: string,
  root = projectRoot,
) {
  const draft = await loadDraft(slug, root);
  if (
    !draft ||
    draft.stale ||
    !draft.topics.some((t) => t.id === id) ||
    typeof title !== "string" ||
    title.trim().length < 3 ||
    title.length > 160
  )
    throw new Error("Macroargomento non valido.");
  const file = path.join(folder(slug, root), "topic-names.json"),
    names = (await readJson<Record<string, string>>(file)) ?? {};
  await atomicJson(file, { ...names, [id]: title.trim() });
}

export function assembleBank(
  draft: EditorDraft,
  allowPartial = false,
): StudyBank {
  if (draft.stale)
    throw new Error("La fonte è cambiata. Ripeti study:prepare.");
  const approved = draft.units.filter(
    (u) =>
      u.kit &&
      u.review?.decision === "approved" &&
      u.review.digest === reviewDigest(u.kit),
  );
  const available = draft.units.length;
  if (!approved.length)
    throw new Error(
      "Approva almeno una raccolta dopo averne controllato i contenuti.",
    );
  if (approved.length < available && !allowPartial)
    throw new Error(
      "Copertura parziale: completa la revisione o scegli esplicitamente di pubblicare soltanto le raccolte approvate.",
    );
  const topics = new Map<string, { id: string; title: string }>(),
    fronts = new Set<string>(),
    questions = new Set<string>();
  const flashcards: StudyBank["flashcards"] = [],
    quiz: StudyBank["quiz"] = [];
  const normalized = (s: string) => normalizeText(s).toLocaleLowerCase("it");
  for (const u of approved) {
    const title = draft.topics.find((t) => t.id === u.topicId)!.title;
    const topicId = `t-${hash(normalized(title)).slice(0, 16)}`;
    topics.set(topicId, { id: topicId, title });
    for (const c of u.kit!.flashcards) {
      const key = hash([normalized(c.front), normalized(c.back), topicId]);
      if (!fronts.has(key)) {
        fronts.add(key);
        flashcards.push({
          ...c,
          id: "f-" + key.slice(0, 16),
          topicId,
        });
      }
    }
    for (const q of u.kit!.quiz) {
      const key = hash([
        normalized(q.question),
        q.choices.map(normalized),
        q.correctIndex,
        normalized(q.explanation),
        topicId,
      ]);
      if (!questions.has(key)) {
        questions.add(key);
        quiz.push({
          ...q,
          id: "q-" + key.slice(0, 16),
          topicId,
        });
      }
    }
  }
  return validateBank({
    schemaVersion: 1,
    subjectSlug: draft.subjectSlug,
    sourceId: draft.source.id,
    sourceSha256: draft.source.sha256,
    sourceUrl: draft.source.fileUrl,
    sourceTitle: draft.source.title,
    publishedAt: new Date().toISOString(),
    reviewedAt: approved
      .map((u) => u.review!.reviewedAt)
      .sort()
      .at(-1),
    topics: [...topics.values()].filter(
      (t) =>
        flashcards.some((c) => c.topicId === t.id) ||
        quiz.some((q) => q.topicId === t.id),
    ),
    flashcards,
    quiz,
    coveredUnits: approved.length,
    availableUnits: available,
  });
}
export async function publishDraft(
  slug: string,
  allowPartial = false,
  root = projectRoot,
) {
  const draft = await loadDraft(slug, root);
  if (!draft) throw new Error("Bozza mancante.");
  const bank = assembleBank(draft, allowPartial);
  await atomicJson(
    path.join(root, "src/content/study-banks", slug + ".json"),
    bank,
  );
  return bank;
}
