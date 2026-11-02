export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_BUCKET = "aula-private";

export class UploadValidationError extends Error {}

export type UploadInput = {
  subjectSlug: string;
  title: string;
  authorName: string;
  rightsConfirmed: boolean;
};

export function validateUploadInput(input: UploadInput, subjectSlugs: readonly string[]) {
  const title = input.title.trim();
  const authorName = input.authorName.trim();
  if (!subjectSlugs.includes(input.subjectSlug)) throw new UploadValidationError("Scegli un insegnamento disponibile.");
  if (title.length < 3 || title.length > 160) throw new UploadValidationError("Il titolo deve contenere da 3 a 160 caratteri.");
  if (authorName.length < 2 || authorName.length > 120) throw new UploadValidationError("Indica l’autore degli appunti (da 2 a 120 caratteri).");
  if (!input.rightsConfirmed) throw new UploadValidationError("Conferma di poter condividere il materiale.");
  return { ...input, title, authorName };
}

export async function inspectPdf(file: File): Promise<string> {
  if (!/\.pdf$/i.test(file.name) || file.name.length > 200) throw new UploadValidationError("Scegli un PDF con un nome di massimo 200 caratteri.");
  if (file.size < 5 || file.size > MAX_UPLOAD_BYTES) throw new UploadValidationError("Il PDF deve essere non vuoto e non superare 5 MB.");
  const bytes = await file.arrayBuffer();
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new UploadValidationError("Il file selezionato non ha un’intestazione PDF valida.");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getPublicUploadConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key?.startsWith("sb_publishable_")) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname)
      || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash || parsed.pathname !== "/") return null;
    return { url: parsed.origin, key };
  } catch { return null; }
}
