import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { UploadDatabase, Upload } from "../uploads/types";
import { getPublicUploadConfig, UPLOAD_BUCKET } from "../uploads/validation";
import { getSubjectBySlug } from "../catalog";
import { STUDY_VERSION } from "./schema";
import type { StudyJob } from "./web-types";
import { DOCUMENT_VERSION, sectionVersion, validateDocumentIndex, type DocumentSection } from "./document";

function configuration() {
  const publicConfig = getPublicUploadConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!publicConfig || !secret?.startsWith("sb_secret_") || !accountId || !/^[a-f0-9]{32}$/i.test(accountId) || !token) {
    // Solo nomi e motivi prestabiliti: nessun valore, prefisso reale o token nei log.
    const problems: string[] = [];
    if (!publicConfig) problems.push("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: configurazione pubblica assente o non valida");
    if (!secret) problems.push("SUPABASE_SECRET_KEY: assente o vuota");
    else if (!secret.startsWith("sb_secret_")) problems.push("SUPABASE_SECRET_KEY: formato non valido; richiesto il prefisso sb_secret_");
    if (!accountId) problems.push("CLOUDFLARE_ACCOUNT_ID: assente o vuoto");
    else if (!/^[a-f0-9]{32}$/i.test(accountId)) problems.push("CLOUDFLARE_ACCOUNT_ID: formato non valido; richiesti 32 caratteri esadecimali");
    if (!token) problems.push("CLOUDFLARE_API_TOKEN: assente o vuoto");
    console.warn("[AULA_STUDIO_CONFIG]", problems.join("; "));
    return null;
  }
  return { ...publicConfig, secret, accountId, token };
}
export function isWebStudyConfigured() {
  const configured = Boolean(configuration());
  if (configured) console.info("[AULA_STUDIO_CONFIG] OK");
  return configured;
}

class HttpError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
const timeoutFetch: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20_000), cache: "no-store" });

async function smallBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json") || !request.body) throw new HttpError(400, "invalid_request");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024) { await reader.cancel(); throw new HttpError(400, "invalid_request"); }
      chunks.push(value);
    }
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const id = (value as { uploadId?: unknown } | null)?.uploadId;
    if (typeof id !== "string" || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) throw new Error("invalid");
    const mode = (value as { mode?: unknown }).mode ?? "legacy";
    if (typeof mode !== "string" || !["legacy", "index", "section"].includes(mode)) throw new Error("invalid");
    const sectionId = (value as { sectionId?: unknown }).sectionId;
    if (mode === "section" && (typeof sectionId !== "string" || !/^s-[a-f0-9]{16}$/.test(sectionId))) throw new Error("invalid");
    return { uploadId: id, mode, sectionId };
  } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, "invalid_request"); }
  finally { reader.releaseLock(); }
}

export async function handleStudyGeneration(request: Request, schedule: (work: () => Promise<void>) => void): Promise<Response> {
  const json = (value: object, status: number) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
  try {
    const config = configuration();
    if (!config) throw new HttpError(503, "not_configured");
    const token = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9._-]{8,8192})$/)?.[1];
    if (!token) throw new HttpError(401, "login_required");
    // Client utente: identità verificata con Auth e lettura tramite RLS.
    const userClient = createClient<UploadDatabase>(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` }, fetch: timeoutFetch },
    });
    const identity = await userClient.auth.getUser(token);
    if (identity.error || !identity.data.user) throw new HttpError(401, "login_required");
    const ownerId = identity.data.user.id;
    const permission = await userClient.rpc("aula_can_contribute");
    if (permission.error || permission.data !== true) throw new HttpError(403, "forbidden");
    const { uploadId, mode, sectionId } = await smallBody(request);
    const result = await userClient.from("aula_uploads").select("*").eq("id", uploadId).eq("owner_id", ownerId).eq("status", "stored").single();
    if (result.error || !result.data) throw new HttpError(404, "upload_missing");
    // Client privilegiato separato: non riceve il token utente e non arriva al browser.
    const admin = createClient<UploadDatabase>(config.url, config.secret, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: timeoutFetch },
    });
    let section: DocumentSection | undefined;
    if (mode === "section") {
      const prepared = await admin.from("aula_study_jobs").select("kit").eq("upload_id", uploadId).eq("owner_id", ownerId).eq("generator_version", DOCUMENT_VERSION).eq("status", "ready").maybeSingle();
      if (prepared.error || !prepared.data?.kit) throw new HttpError(409, "index_required");
      const index = validateDocumentIndex(prepared.data.kit);
      if (index.resourceId !== `upload-${uploadId}` || index.sourceSha256 !== result.data.sha256 || index.subjectSlug !== result.data.subject_slug) throw new HttpError(409, "index_required");
      section = index.sections.find((s) => s.id === sectionId);
      if (!section?.canGenerate) throw new HttpError(400, "section_unavailable");
    }
    const version = mode === "index" ? DOCUMENT_VERSION : section ? sectionVersion(section) : STUDY_VERSION;
    const claim = await admin.rpc("aula_claim_study_job", { p_upload_id: uploadId, p_owner_id: ownerId, p_version: version });
    if (claim.error) {
      if (claim.error.message === "AULA_DAILY_LIMIT") throw new HttpError(429, mode === "index" ? "preparation_limit" : "daily_limit");
      if (claim.error.message === "AULA_UPLOAD_BUSY") throw new HttpError(409, "upload_busy");
      if (claim.error.message === "AULA_FORBIDDEN") throw new HttpError(403, "forbidden");
      if (claim.error.message === "AULA_NOT_FOUND") throw new HttpError(404, "upload_missing");
      throw new HttpError(503, "storage_unavailable");
    }
    const { job, claimed } = claim.data;
    if (claimed) {
      const upload = result.data;
      schedule(async () => {
        let status = "ready", code: string | null = null, kit: unknown = null;
        try {
          const access = await admin.from("aula_contributors").select("enabled").eq("user_id", ownerId).single();
          if (access.error || access.data?.enabled !== true) throw new Error("access_revoked");
          const file = await admin.storage.from(UPLOAD_BUCKET).download(upload.object_path);
          if (file.error || !file.data) throw new Error("source_missing");
          const { generateUploadedStudyKit, verifyUploadedSource } = await import("./web-core");
          const bytes = new Uint8Array(await file.data.arrayBuffer());
          verifyUploadedSource(upload as Upload, bytes);
          if (mode === "index") {
            const { extractDocumentIndex } = await import("../../../scripts/study/document.mts");
            kit = await extractDocumentIndex(bytes, { resourceId: `upload-${upload.id}`, subjectSlug: upload.subject_slug, sourceSha256: upload.sha256 });
          } else {
            const { createCloudflareGenerator } = await import("../../../scripts/study/cloudflare.mts");
            const generator = createCloudflareGenerator({ CLOUDFLARE_ACCOUNT_ID: config.accountId, CLOUDFLARE_API_TOKEN: config.token });
            kit = await generateUploadedStudyKit(upload as Upload, bytes, getSubjectBySlug(upload.subject_slug)?.title ?? upload.subject_slug, generator, section);
          }
        } catch (error) {
          status = "failed";
          const known = error as { code?: string; message?: string };
          code = typeof known.code === "string" ? known.code : ["access_revoked", "document_limit", "source_unsupported"].includes(known.message ?? "") ? known.message! : "processing_failed";
          console.error("Aula: elaborazione non completata", { jobId: job.id, code });
        }
        try {
          const saved = await admin.rpc("aula_finish_study_job", { p_job_id: job.id, p_status: status, p_error: code, p_kit: kit });
          if (saved.error) console.error("Aula: salvataggio elaborazione non completato", { jobId: job.id });
        } catch { console.error("Aula: archivio elaborazioni non raggiungibile", { jobId: job.id }); }
      });
    }
    return json({ jobId: (job as StudyJob).id, status: job.status }, claimed ? 202 : 200);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.code }, error.status);
    return json({ error: "service_unavailable" }, 503);
  }
}
