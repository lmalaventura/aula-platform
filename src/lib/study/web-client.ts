import type { SupabaseClient } from "@supabase/supabase-js";
import type { Upload, UploadDatabase } from "../uploads/types";
import { STUDY_VERSION, validateStudyKit } from "./schema";
import type { StudyJobSummary } from "./web-types";

const startErrors: Record<string, string> = {
  login_required: "Accedi nuovamente prima di generare gli strumenti.",
  forbidden: "Il tuo account non è abilitato alla generazione.",
  upload_missing: "Il contributo non è disponibile o il caricamento non è completo.",
  daily_limit: "Hai raggiunto il limite di 5 nuove elaborazioni nelle ultime 24 ore. I risultati pronti restano utilizzabili.",
  not_configured: "La generazione sul server non è ancora configurata.",
  storage_unavailable: "Archivio elaborazioni non disponibile. Controlla la configurazione e riprova.",
};
export class WebStudyClientError extends Error {}

export function createWebStudyRepository(client: SupabaseClient<UploadDatabase>) {
  return {
    async start(uploadId: string) {
      const session = await client.auth.getSession();
      if (session.error || !session.data.session) throw new WebStudyClientError(startErrors.login_required);
      const response = await fetch("/api/studio/genera", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.data.session.access_token}` },
        body: JSON.stringify({ uploadId }), signal: AbortSignal.timeout(30_000),
      });
      const data = await response.json();
      if (!response.ok) throw new WebStudyClientError(startErrors[data.error] ?? "La generazione non è stata avviata. Aggiorna l’elenco prima di riprovare.");
      return data as { jobId: string; status: string };
    },
    async list(uploadIds: string[]): Promise<StudyJobSummary[]> {
      if (!uploadIds.length) return [];
      const { data, error } = await client.from("aula_study_latest").select("*").in("upload_id", uploadIds).eq("generator_version", STUDY_VERSION).abortSignal(AbortSignal.timeout(15_000));
      if (error) throw new WebStudyClientError("Impossibile leggere le elaborazioni. Verifica la migrazione del database e riprova con Aggiorna elenco.");
      return data;
    },
    async load(jobId: string, upload: Upload) {
      const { data, error } = await client.from("aula_study_jobs").select("kit").eq("id", jobId).eq("upload_id", upload.id).eq("status", "ready").single();
      if (error || !data?.kit) throw new Error("Le attività non sono disponibili. Aggiorna l’elenco.");
      const kit = validateStudyKit(data.kit);
      if (kit.resourceId !== `upload-${upload.id}` || kit.sourceSha256 !== upload.sha256 || kit.subjectSlug !== upload.subject_slug || kit.generatorVersion !== STUDY_VERSION) {
        throw new Error("La raccolta non corrisponde al documento corrente.");
      }
      return kit;
    },
  };
}
