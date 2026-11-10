import type { StudyKit } from "./schema.ts";
import type { DocumentIndex } from "./document.ts";

export type StudyJob = {
  id: string;
  upload_id: string;
  owner_id: string;
  status: "processing" | "ready" | "failed";
  generator_version: string;
  started_at: string;
  finished_at: string | null;
  error_code: string | null;
  kit: StudyKit | DocumentIndex | null;
};
export type StudyJobSummary = Omit<StudyJob, "kit">;
export const JOB_COLUMNS = "id,upload_id,owner_id,status,generator_version,started_at,finished_at,error_code";
export function jobExpired(job: StudyJobSummary, now = Date.now()) {
  return job.status === "processing" && now - Date.parse(job.started_at) > 360_000;
}
export function studyErrorMessage(code: string | null): string {
  switch (code) {
    case "source_unsupported": return "Il PDF non contiene abbastanza testo leggibile. Le scansioni richiedono ancora OCR.";
    case "document_limit": return "Questo PDF supera il limite di 250 pagine o un milione di caratteri. Dividilo in più documenti; nessuna parte è stata indicizzata parzialmente.";
    case "source_mismatch": return "Il file non corrisponde all’impronta o alla dimensione registrata. Caricalo di nuovo.";
    case "provider_quota": return "Il servizio AI ha raggiunto la quota o è temporaneamente occupato. Riprova più tardi.";
    case "provider_failed": return "Il servizio AI non ha completato la richiesta. Puoi riprovare più tardi.";
    case "invalid_output": return "Le risposte generate non hanno superato i controlli. Nessuna attività incompleta è stata pubblicata.";
    case "expired": return "L’elaborazione si è interrotta o ha superato il tempo disponibile. Puoi riprovare.";
    case "access_revoked": return "L’account non è più abilitato alla generazione.";
    default: return "Elaborazione non completata. Aggiorna l’elenco e riprova.";
  }
}
