"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Upload, UploadDatabase } from "@/lib/uploads/types";
import { createUploadsRepository } from "@/lib/uploads/repository";
import { createWebStudyRepository } from "@/lib/study/web-client";
import type { StudyKit } from "@/lib/study/schema";
import { STUDY_VERSION } from "@/lib/study/schema";
import { StudySession } from "./study-session";

export function UploadedStudySession({ client, upload, jobId, expectedVersion = STUDY_VERSION, nested = false }: {
  client: SupabaseClient<UploadDatabase>; upload: Upload; jobId: string; expectedVersion?: string; nested?: boolean;
}) {
  const studies = useMemo(() => createWebStudyRepository(client), [client]);
  const uploads = useMemo(() => createUploadsRepository(client), [client]);
  const [result, setResult] = useState<{ kit: StudyKit; fileUrl: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true, fileUrl: string | undefined;
    async function load() {
      try {
        const [kit, pdf] = await Promise.all([studies.load(jobId, upload, expectedVersion), uploads.download(upload)]);
        if (!active) return;
        // Il PDF viene letto tramite l'account, senza rendere pubblico il bucket.
        fileUrl = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
        setResult({ kit, fileUrl });
      } catch { if (active) setError("Impossibile aprire gli strumenti o la fonte. Chiudi gli strumenti, aggiorna l’elenco e riprova."); }
    }
    void load();
    return () => { active = false; if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [jobId, studies, uploads, upload, expectedVersion]);
  if (error) return <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-900">{error}</p>;
  if (!result) return <p role="status" className="mt-5">Apertura degli strumenti e del PDF fonte…</p>;
  const Heading = nested ? "h6" : "h4";
  return (
    <section aria-label={`Strumenti di studio: ${upload.title}`} className="mt-5 border-t border-border pt-5">
      <Heading className="text-xl font-semibold">{result.kit.title}</Heading>
      <p className="mt-3 text-sm leading-7 text-muted">{result.kit.summary}</p>
      <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-950">Attività generate con AI, non revisionate disciplinarmente. Copertura parziale: pagine fisiche del PDF {result.kit.sourcePages.map((p) => p.page).join(", ")}. Controlla spiegazioni e citazioni sulla fonte.</p>
      <p className="mt-3 text-xs leading-6 text-muted">Built with Llama · Generato il {new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeZone: "Europe/Rome" }).format(new Date(result.kit.generatedAt))}</p>
      <StudySession flashcards={result.kit.flashcards} quiz={result.kit.quiz} fileUrl={result.fileUrl} />
    </section>
  );
}
