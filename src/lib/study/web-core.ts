import { createHash } from "node:crypto";
import { MAX_UPLOAD_BYTES } from "../uploads/validation.ts";
import type { Upload } from "../uploads/types.ts";
import type { StudyKit } from "./schema.ts";
import { sectionVersion, type DocumentSection } from "./document.ts";
import { createStudyKit } from "../../../scripts/study/generate.mts";
import type { StudyGenerator } from "../../../scripts/study/cloudflare.mts";

export class StudyProcessingError extends Error {
  code: string;
  constructor(code: string) { super(code); this.code = code; }
}

export function verifyUploadedSource(upload: Upload, bytes: Uint8Array) {
  if (bytes.length !== upload.byte_size || bytes.length > MAX_UPLOAD_BYTES ||
      new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-" ||
      createHash("sha256").update(bytes).digest("hex") !== upload.sha256) throw new StudyProcessingError("source_mismatch");
}

export async function generateUploadedStudyKit(
  upload: Upload, bytes: Uint8Array, subjectTitle: string, generate: StudyGenerator, section?: DocumentSection,
): Promise<StudyKit> {
  verifyUploadedSource(upload, bytes);
  let extracted;
  try {
    if (section) {
      if (!section.canGenerate) throw new Error("source_unsupported");
      extracted = { sourcePages: section.pages, sourceSha256: upload.sha256 };
    } else {
      const { extractSourcePagesFromBytes } = await import("../../../scripts/study/pdf.mts");
      extracted = await extractSourcePagesFromBytes(bytes);
    }
  } catch { throw new StudyProcessingError("source_unsupported"); }
  try {
    return await createStudyKit({
      resourceId: `upload-${upload.id}`, subjectSlug: upload.subject_slug,
      sourceTitle: upload.title, subjectTitle, sourceSha256: extracted.sourceSha256,
      sourcePages: extracted.sourcePages,
      ...(section ? { generatorVersion: sectionVersion(section) } : {}),
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
