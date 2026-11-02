import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { STUDY_MODEL, STUDY_VERSION, validateStudyDraft, validateStudyKit, type SourcePage, type StudyKit } from "../../src/lib/study/schema.ts";
import type { StudyGenerator } from "./cloudflare.mts";
import { buildEvidencePassages, resolveDraftEvidence } from "./evidence.mts";
import { validateDraftQuality } from "./quality.mts";

export type StudySource = {
  resourceId: string;
  subjectSlug: string;
  sourceTitle: string;
  subjectTitle: string;
  sourceSha256: string;
  sourcePages: SourcePage[];
};

export function generationFingerprint(source: StudySource): string {
  return createHash("sha256").update(JSON.stringify({ ...source, model: STUDY_MODEL, version: STUDY_VERSION })).digest("hex");
}

export type RejectedDraft = { attempt: number; reason: string; raw: unknown };

export async function createStudyKit(source: StudySource, generate: StudyGenerator, onRejected?: (failure: RejectedDraft) => Promise<void>): Promise<StudyKit> {
  const passages = buildEvidencePassages(source.sourcePages);
  let correction: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    // Errori HTTP o di rete si propagano: non si consumano chiamate in un ciclo di retry.
    const raw = await generate({ sourceTitle: source.sourceTitle, subjectTitle: source.subjectTitle, pages: source.sourcePages, correction });
    try {
      const draft = validateStudyDraft(resolveDraftEvidence(raw, passages), source.sourcePages);
      validateDraftQuality(draft);
      return validateStudyKit({
        ...draft, schemaVersion: 1, generatorVersion: STUDY_VERSION, generatedAt: new Date().toISOString(),
        provider: "cloudflare", model: STUDY_MODEL, fingerprint: generationFingerprint(source),
        resourceId: source.resourceId, subjectSlug: source.subjectSlug,
        sourceSha256: source.sourceSha256, sourcePages: source.sourcePages,
      });
    } catch (error) {
      correction = error instanceof Error ? error.message : "Controlla formato e citazioni.";
      await onRejected?.({ attempt: attempt + 1, reason: correction, raw });
    }
  }
  throw new Error(`Generazione rifiutata dopo due risposte: ${correction} Il precedente file, se presente, rimane invariato.`);
}

export async function readCachedKit(filePath: string, fingerprint: string): Promise<StudyKit | undefined> {
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return undefined;
    throw error;
  }
  try {
    const kit = validateStudyKit(JSON.parse(content));
    if (kit.generatorVersion !== STUDY_VERSION || kit.fingerprint !== fingerprint) return undefined;
    validateDraftQuality(kit);
    return kit;
  } catch {
    return undefined;
  }
}

export async function saveStudyKit(filePath: string, kit: StudyKit): Promise<void> {
  const valid = validateStudyKit(kit);
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(valid, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
