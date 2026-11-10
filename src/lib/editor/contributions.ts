import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicUploadConfig, UPLOAD_BUCKET } from "../uploads/validation";
import type { UploadDatabase } from "../uploads/types";
import type { ContributionRow } from "./types";
function client() {
  const config = getPublicUploadConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!config || !secret?.startsWith("sb_secret_"))
    throw new Error(
      "Configura Supabase in .env.local per leggere i contributi.",
    );
  return createClient<UploadDatabase>(config.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(20_000),
          cache: "no-store",
        }),
    },
  });
}
export async function listContributions(): Promise<ContributionRow[]> {
  const db = client(),
    uploads = await db
      .from("aula_uploads")
      .select("id,subject_slug,title,author_name,original_name")
      .eq("status", "stored")
      .order("created_at", { ascending: false })
      .limit(100);
  if (uploads.error) throw new Error("Impossibile leggere i contributi.");
  if (!uploads.data.length) return [];
  const reviews = await db
    .from("aula_contribution_reviews")
    .select("*")
    .in(
      "upload_id",
      uploads.data.map((u) => u.id),
    );
  if (reviews.error)
    throw new Error(
      "Esegui la nuova migrazione delle revisioni dei contributi.",
    );
  return uploads.data.map((u) => {
    const review = reviews.data.find((r) => r.upload_id === u.id);
    return {
      ...u,
      status: review?.status ?? "pending",
      note: review?.note ?? "",
    };
  });
}
export async function reviewContribution(
  id: string,
  status: ContributionRow["status"],
  note: string,
) {
  if (
    !/^[a-f0-9-]{36}$/.test(id) ||
    !["pending", "accepted", "changes_requested", "rejected"].includes(
      status,
    ) ||
    typeof note !== "string" ||
    note.length > 2000
  )
    throw new Error("Revisione contributo non valida.");
  const db = client(),
    item = await db
      .from("aula_uploads")
      .select("id")
      .eq("id", id)
      .eq("status", "stored")
      .single();
  if (item.error) throw new Error("Contributo non disponibile.");
  const result = await db
    .from("aula_contribution_reviews")
    .upsert({
      upload_id: id,
      status,
      note: note.trim(),
      reviewed_at: new Date().toISOString(),
    });
  if (result.error)
    throw new Error("Revisione non salvata. Controlla la migrazione.");
}
export async function contributionPdf(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Contributo non valido.");
  const db = client(),
    item = await db
      .from("aula_uploads")
      .select("*")
      .eq("id", id)
      .eq("status", "stored")
      .single();
  if (item.error) throw new Error("Contributo non disponibile.");
  const response = await db.storage
    .from(UPLOAD_BUCKET)
    .download(item.data.object_path);
  if (response.error || !response.data) throw new Error("PDF non disponibile.");
  const bytes = new Uint8Array(await response.data.arrayBuffer());
  const { verifyUploadedSource } = await import("../study/web-core");
  verifyUploadedSource(item.data, bytes);
  return { bytes, name: item.data.original_name };
}
