import type { SupabaseClient } from "@supabase/supabase-js";
import type { Upload, UploadDatabase } from "./types.ts";
import { inspectPdf, UPLOAD_BUCKET, UploadValidationError, validateUploadInput, type UploadInput } from "./validation.ts";

export function uploadError(error: unknown): string {
  if (error instanceof UploadValidationError) return error.message;
  const item = error as { code?: string; message?: string } | null;
  if (item?.code === "23505") return "Hai già caricato questo PDF per la materia. Controlla anche i caricamenti incompleti.";
  if (item?.message === "AULA_FILE_MISSING") return "Il file non è arrivato nell’archivio. Elimina il caricamento incompleto e riprova.";
  if (item?.message === "AULA_FILE_MISMATCH") return "Il file salvato non corrisponde ai metadati. Elimina il caricamento e riprova.";
  if (item?.message === "AULA_REMOVE_FILE_FIRST") return "Il file è ancora nell’archivio. Riprova l’eliminazione.";
  if (item?.code === "42501" || item?.message === "AULA_FORBIDDEN") return "Operazione non autorizzata. Controlla l’abilitazione del tuo account.";
  return "Operazione non completata. Controlla la connessione, aggiorna l’elenco e riprova. Un caricamento incompleto può essere verificato o eliminato.";
}

export function createUploadsRepository(client: SupabaseClient<UploadDatabase>) {
  const bucket = client.storage.from(UPLOAD_BUCKET);
  return {
    async canContribute() {
      const { data, error } = await client.rpc("aula_can_contribute");
      if (error) throw error;
      return data === true;
    },
    async list(): Promise<Upload[]> {
      const { data, error } = await client.from("aula_uploads").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    async add(input: UploadInput, file: File, subjectSlugs: readonly string[]) {
      const valid = validateUploadInput(input, subjectSlugs);
      const sha256 = await inspectPdf(file);
      const { data, error } = await client.from("aula_uploads").insert({
        id: crypto.randomUUID(), subject_slug: valid.subjectSlug, title: valid.title,
        author_name: valid.authorName, original_name: file.name, byte_size: file.size,
        sha256, rights_confirmed: true,
      }).select().single();
      if (error) throw error;
      // La prenotazione resta visibile se il browser si chiude o la rete cade.
      const uploaded = await bucket.upload(data.object_path, file, { contentType: "application/pdf", upsert: false });
      if (uploaded.error) throw uploaded.error;
      const completed = await client.rpc("aula_complete_upload", { upload_id: data.id });
      if (completed.error) throw completed.error;
    },
    async complete(id: string) {
      const { error } = await client.rpc("aula_complete_upload", { upload_id: id });
      if (error) throw error;
    },
    async remove(item: Upload) {
      // Eliminare prima l'oggetto tramite Storage, mai modificare storage.objects con SQL.
      const removed = await bucket.remove([item.object_path]);
      if (removed.error) throw removed.error;
      const { error } = await client.rpc("aula_delete_upload", { upload_id: item.id });
      if (error) throw error;
    },
    async download(item: Upload): Promise<Blob> {
      const { data, error } = await bucket.download(item.object_path);
      if (error) throw error;
      return data;
    },
  };
}
