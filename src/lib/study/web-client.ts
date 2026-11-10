import type { SupabaseClient } from "@supabase/supabase-js";
import type { Upload, UploadDatabase } from "../uploads/types";
import { STUDY_VERSION, validateStudyKit } from "./schema";
import type { StudyJobSummary } from "./web-types";
import { DOCUMENT_VERSION, validateDocumentIndex } from "./document";

const startErrors: Record<string, string> = {
  login_required: "Accedi nuovamente prima di generare gli strumenti.",
  forbidden: "Il tuo account non è abilitato alla generazione.",
  upload_missing: "Il contributo non è disponibile o il caricamento non è completo.",
  daily_limit: "Hai raggiunto il limite di 5 nuove elaborazioni nelle ultime 24 ore. I risultati pronti restano utilizzabili.",
  not_configured: "La generazione sul server non è ancora configurata.",
  storage_unavailable: "Archivio elaborazioni non disponibile. Controlla la configurazione e riprova.",
  preparation_limit: "Hai raggiunto il limite di 5 preparazioni di documenti nelle ultime 24 ore. Gli indici pronti restano disponibili.",
  upload_busy: "Questo PDF ha già un’elaborazione in corso. Attendi che termini e riprova.",
  index_required: "Prepara prima l’indice del documento, poi scegli la sezione.",
  section_unavailable: "La sezione non è disponibile o non contiene abbastanza testo per generare attività.",
};
export class WebStudyClientError extends Error {}

export function createWebStudyRepository(client: SupabaseClient<UploadDatabase>) {
  async function start(uploadId: string, options?: { mode: "index" | "section"; sectionId?: string }) {
    const session = await client.auth.getSession();
    if (session.error || !session.data.session) throw new WebStudyClientError(startErrors.login_required);
    const response = await fetch("/api/studio/genera", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.data.session.access_token}` },
      body: JSON.stringify({ uploadId, ...options }), signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json();
    if (!response.ok) throw new WebStudyClientError(startErrors[data.error] ?? "La generazione non è stata avviata. Aggiorna l’elenco prima di riprovare.");
    return data as { jobId: string; status: string };
  }
  return {
    start,
    prepare(uploadId: string) { return start(uploadId, { mode: "index" }); },
    startSection(uploadId: string, sectionId: string) { return start(uploadId, { mode: "section", sectionId }); },
    async listDocument(uploadId: string): Promise<StudyJobSummary[]> {
      const { data, error } = await client.from("aula_study_latest").select("*").eq("upload_id", uploadId).abortSignal(AbortSignal.timeout(15_000));
      if (error) throw new WebStudyClientError("Impossibile leggere l’indice. Controlla la migrazione del database e riprova.");
      return data;
    },
    async loadDocument(jobId: string, upload: Upload) {
      const { data, error } = await client.from("aula_study_jobs").select("kit").eq("id", jobId).eq("upload_id", upload.id).eq("generator_version", DOCUMENT_VERSION).eq("status", "ready").single();
      if (error || !data?.kit) throw new WebStudyClientError("Indice non disponibile. Aggiorna e riprova.");
      const index = validateDocumentIndex(data.kit);
      if (index.resourceId !== `upload-${upload.id}` || index.sourceSha256 !== upload.sha256 || index.subjectSlug !== upload.subject_slug) throw new WebStudyClientError("L’indice non corrisponde al documento.");
      return index;
    },
    async list(uploadIds: string[]): Promise<StudyJobSummary[]> {
      if (!uploadIds.length) return [];
      const { data, error } = await client.from("aula_study_latest").select("*").in("upload_id", uploadIds).eq("generator_version", STUDY_VERSION).abortSignal(AbortSignal.timeout(15_000));
      if (error) throw new WebStudyClientError("Impossibile leggere le elaborazioni. Verifica la migrazione del database e riprova con Aggiorna elenco.");
      return data;
    },
    async load(jobId: string, upload: Upload, expectedVersion = STUDY_VERSION) {
      const { data, error } = await client.from("aula_study_jobs").select("kit").eq("id", jobId).eq("upload_id", upload.id).eq("status", "ready").single();
      if (error || !data?.kit) throw new Error("Le attività non sono disponibili. Aggiorna l’elenco.");
      const kit = validateStudyKit(data.kit);
      if (kit.resourceId !== `upload-${upload.id}` || kit.sourceSha256 !== upload.sha256 || kit.subjectSlug !== upload.subject_slug || kit.generatorVersion !== expectedVersion) {
        throw new Error("La raccolta non corrisponde al documento corrente.");
      }
      return kit;
    },
  };
}
