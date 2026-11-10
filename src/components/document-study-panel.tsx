"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Upload, UploadDatabase } from "@/lib/uploads/types";
import { createWebStudyRepository } from "@/lib/study/web-client";
import { DOCUMENT_VERSION, sectionPages, sectionVersion, type DocumentIndex } from "@/lib/study/document";
import { jobExpired, studyErrorMessage, type StudyJobSummary } from "@/lib/study/web-types";
import { UploadedStudySession } from "./uploaded-study-session";

const button = "inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60";

export function DocumentStudyPanel({ client, upload }: { client: SupabaseClient<UploadDatabase>; upload: Upload }) {
  const studies = useMemo(() => createWebStudyRepository(client), [client]);
  const [index, setIndex] = useState<DocumentIndex | null>(null);
  const [jobs, setJobs] = useState<StudyJobSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now);
  const mounted = useRef(false), loaded = useRef("");
  const searchId = useId();
  const indexJob = jobs.find((j) => j.generator_version === DOCUMENT_VERSION);
  const running = jobs.some((j) => j.status === "processing" && !jobExpired(j, clock));

  const refresh = useCallback(async () => {
    const rows = await studies.listDocument(upload.id);
    if (!mounted.current) return;
    setJobs(rows); setClock(Date.now());
    const prepared = rows.find((j) => j.generator_version === DOCUMENT_VERSION && j.status === "ready");
    if (prepared && loaded.current !== prepared.id) {
      const document = await studies.loadDocument(prepared.id, upload);
      if (mounted.current) { setIndex(document); loaded.current = prepared.id; }
    }
  }, [studies, upload]);

  useEffect(() => {
    mounted.current = true;
    void refresh().catch(() => { if (mounted.current) setError("Impossibile leggere le sezioni. Riprova con Aggiorna sezioni."); });
    return () => { mounted.current = false; };
  }, [refresh]);
  useEffect(() => {
    if (!running) return;
    let inFlight = false, active = true;
    const timer = window.setInterval(async () => {
      if (document.visibilityState === "hidden" || inFlight) return;
      inFlight = true;
      try { await refresh(); }
      catch { if (active) setError("Aggiornamento interrotto. Riprova con Aggiorna sezioni."); }
      finally { inFlight = false; if (active) setClock(Date.now()); }
    }, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refresh, running]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await action(); await refresh(); }
    catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : "Operazione non completata."); }
    finally { if (mounted.current) setBusy(false); }
  }
  const needle = query.trim().toLocaleLowerCase("it");
  const sections = index?.sections.filter((s) => !needle || `${s.title} ${s.pages.map((p) => p.text).join(" ")}`.toLocaleLowerCase("it").includes(needle)) ?? [];
  const ready = index?.sections.filter((s) => jobs.some((j) => j.generator_version === sectionVersion(s) && j.status === "ready")).length ?? 0;
  return (
    <section aria-label={`Studio per sezioni: ${upload.title}`} className="mt-5 min-w-0 border-t border-border pt-5 [overflow-wrap:anywhere]" aria-busy={busy}>
      <h4 className="text-xl font-semibold">Studia per sezioni</h4>
      <p className="mt-3 text-sm leading-7 text-muted">Scegli cosa ripassare: ogni sezione prepara sei flashcard e quattro quesiti. Le raccolte pronte si riaprono senza nuove chiamate AI. Massimo cinque nuove generazioni in 24 ore per account, comprese le raccolte iniziali.</p>
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-900">{error}</p>}
      <button type="button" className={`${button} mt-3`} disabled={busy} onClick={() => run(refresh)}>Aggiorna sezioni</button>
      {!index && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7">
          {indexJob?.status === "failed" || (indexJob && jobExpired(indexJob, clock)) ? (
            <><p>{studyErrorMessage(jobExpired(indexJob, clock) ? "expired" : indexJob.error_code)}</p><button type="button" disabled={busy || running} className={`${button} mt-3`} onClick={() => run(() => studies.prepare(upload.id))}>Riprova preparazione</button></>
          ) : <p role="status">Preparazione delle sezioni del PDF sul server… Puoi tornare qui più tardi. Questa operazione non invia il testo al servizio AI.</p>}
        </div>
      )}
      {index && (
        <>
          <p className="mt-4 text-sm leading-7 text-muted">Documento esaminato: {index.pageCount} pagine fisiche. Sezioni: {index.sections.length}. Raccolte pronte: {ready}. I titoli disponibili provengono dai segnalibri del PDF; in loro assenza, le sezioni sono numerate. Le sezioni lunghe sono divise in più parti.</p>
          <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-950">L’indice descrive il testo estratto, non certifica la copertura di ogni concetto. Attività AI non revisionate: verifica risposte e citazioni sulla fonte.</p>
          {index.skippedPages.length > 0 && <details className="mt-3 text-sm leading-7 text-muted"><summary className="cursor-pointer">Pagine escluse dall’indice ({index.skippedPages.length})</summary><p className="mt-2">{index.skippedPages.join(", ")}. Contengono poco testo estraibile o sono riconosciute come indice. Immagini, formule e scansioni possono richiedere lettura diretta o OCR.</p></details>}
          <label htmlFor={searchId} className="mt-5 block text-sm font-medium">Cerca nelle sezioni</label>
          <input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Es. regressione, classificazione…" className="mt-2 min-h-12 w-full rounded-xl border border-border px-3 py-2 text-base" />
          <p className="mt-2 text-sm text-muted" role="status">{sections.length === 1 ? "1 sezione trovata" : `${sections.length} sezioni trovate`}</p>
          <ol className="mt-4 space-y-4">
            {sections.map((section) => {
              const version = sectionVersion(section);
              const job = jobs.find((j) => j.generator_version === version);
              const expired = job ? jobExpired(job, clock) : false;
              return (
                <li key={section.id} className="min-w-0 rounded-xl border border-border p-4">
                  <h5 className="font-semibold">{section.title}</h5>
                  <p className="mt-2 text-sm text-muted">Pagine fisiche: {sectionPages(section)}</p>
                  <details className="mt-2 text-sm leading-7 text-muted"><summary className="cursor-pointer">Anteprima della fonte</summary><p className="mt-2">{section.pages[0].text.slice(0, 420)}…</p></details>
                  {!section.canGenerate ? <p className="mt-3 text-sm leading-7 text-muted">Testo insufficiente per preparare le attività. Consulta queste pagine nel PDF originale.</p> : job?.status === "ready" ? (
                    <button type="button" className={`${button} mt-3`} aria-expanded={open === section.id} onClick={() => setOpen(open === section.id ? null : section.id)}>{open === section.id ? "Chiudi attività" : "Apri attività"}</button>
                  ) : (
                    <button type="button" className={`${button} mt-3`} aria-label={`Genera attività: ${section.title}`} disabled={busy || running} onClick={() => run(() => studies.startSection(upload.id, section.id))}>{job?.status === "processing" && !expired ? "Generazione in corso…" : job ? "Riprova attività" : "Genera attività"}</button>
                  )}
                  {job?.status === "processing" && !expired && <p role="status" className="mt-3 text-sm leading-7 text-muted">Generazione sul server. Puoi chiudere la pagina: la raccolta sarà conservata nel tuo archivio.</p>}
                  {job && (job.status === "failed" || expired) && <p className="mt-3 text-sm leading-7 text-red-900">{studyErrorMessage(expired ? "expired" : job.error_code)}</p>}
                  {job?.status === "ready" && open === section.id && <UploadedStudySession key={job.id} client={client} upload={upload} jobId={job.id} expectedVersion={version} nested />}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
