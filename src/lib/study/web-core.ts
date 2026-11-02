import { createHash } from "node:crypto";
import { MAX_UPLOAD_BYTES } from "../uploads/validation.ts";
import type { Upload } from "../uploads/types.ts";
import type { StudyKit } from "./schema.ts";
import { createStudyKit } from "../../../scripts/study/generate.mts";
import type { StudyGenerator } from "../../../scripts/study/cloudflare.mts";

export class StudyProcessingError extends Error {
  code: string;
  constructor(code: string) { super(code); this.code = code; }
}

export async function generateUploadedStudyKit(
  upload: Upload, bytes: Uint8Array, subjectTitle: string, generate: StudyGenerator,
): Promise<StudyKit> {
  if (bytes.length !== upload.byte_size || bytes.length > MAX_UPLOAD_BYTES ||
      new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-" ||
      createHash("sha256").update(bytes).digest("hex") !== upload.sha256) {
    throw new StudyProcessingError("source_mismatch");
  }
  let extracted;
  try {
    const { extractSourcePagesFromBytes } = await import("../../../scripts/study/pdf.mts");
    extracted = await extractSourcePagesFromBytes(bytes);
  } catch { throw new StudyProcessingError("source_unsupported"); }
  try {
    return await createStudyKit({
      resourceId: `upload-${upload.id}`, subjectSlug: upload.subject_slug,
      sourceTitle: upload.title, subjectTitle, sourceSha256: extracted.sourceSha256,
      sourcePages: extracted.sourcePages,
    }, generate);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/Cloudflare: HTTP (429|503)/.test(message)) throw new StudyProcessingError("provider_quota");
    if (/Cloudflare:/.test(message) || (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) || (error instanceof TypeError && message === "fetch failed")) {
      throw new StudyProcessingError("provider_failed");
    }
    throw new StudyProcessingError("invalid_output");
  }
}
