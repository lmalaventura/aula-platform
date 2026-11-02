import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { UploadDatabase } from "./types.ts";

declare global {
  interface Window {
    __aulaUploadClients?: Map<string, SupabaseClient<UploadDatabase>>;
  }
}

export function getBrowserUploadClient(config: { url: string; key: string }): SupabaseClient<UploadDatabase> {
  if (typeof window === "undefined") {
    throw new Error("Il client dell’area collaboratori deve essere inizializzato nel browser.");
  }

  // Il browser conserva l'istanza fra navigazioni, Strict Mode e Fast Refresh.
  // Nessuna istanza o sessione viene condivisa nel processo server di Next.
  const clients = window.__aulaUploadClients ??= new Map<string, SupabaseClient<UploadDatabase>>();
  const cacheKey = `${config.url}\u0000${config.key}`;
  let client = clients.get(cacheKey);
  if (!client) {
    client = createClient<UploadDatabase>(config.url, config.key, {
      auth: { detectSessionInUrl: false },
    });
    clients.set(cacheKey, client);
  }
  return client;
}
