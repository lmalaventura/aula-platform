"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserUploadClient } from "@/lib/uploads/browser-client";
import { createUploadsRepository, uploadError } from "@/lib/uploads/repository";
import type { Upload, UploadDatabase } from "@/lib/uploads/types";
import { createWebStudyRepository, WebStudyClientError } from "@/lib/study/web-client";
import { jobExpired, studyErrorMessage, type StudyJobSummary } from "@/lib/study/web-types";
import { UploadedStudySession } from "./uploaded-study-session";

type SubjectOption = { slug: string; title: string };
const field = "mt-2 block min-h-12 w-full rounded-xl border border-border bg-white px-3 py-2 text-base";
const button = "inline-flex min-h-12 items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-accent disabled:cursor-wait disabled:opacity-60";
const secondary = "inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60";

export function ContributorPanel({ config, subjects, studyEnabled }: {
  config: { url: string; key: string }; subjects: SubjectOption[]; studyEnabled: boolean;
}) {
  // La sessione serve all'area interattiva; i dati privati non passano nella pagina statica.
  // RLS verifica il token sul servizio remoto per ogni lettura/scrittura.
  const { url, key } = config;
  const [connection, setConnection] = useState<{
    client: SupabaseClient<UploadDatabase>; session: Session | null;
  } | null>(null);
  const client = connection?.client;
  const session = connection?.session;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = getBrowserUploadClient({ url, key });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      // Nessuna chiamata asincrona Supabase dentro il callback Auth.
      setConnection({ client, session: next });
    });
    return () => data.subscription.unsubscribe();
  }, [url, key]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const form = event.currentTarget;
    const input = new FormData(form);
    setBusy(true); setError("");
    try {
      const { error } = await client.auth.signInWithPassword({ email: String(input.get("email")).trim(), password: String(input.get("password")) });
      if (error) throw error;
    } catch {
      setError("Accesso non riuscito. Controlla email, password e connessione. L’account deve essere stato creato dall’amministratore.");
    } finally { setBusy(false); }
  }

  async function logout() {
    if (!client) return;
    setBusy(true); setError("");
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch { setError("Uscita non completata. Controlla la connessione e riprova."); }
    finally { setBusy(false); }
  }

  if (!client || session === undefined) return <p role="status" className="mt-8">Controllo dell’accesso…</p>;
  return (
    <div className="mt-8">
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{error}</p>}
      {session ? (
        <>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-5">
            <p className="min-w-0 break-all text-sm text-muted">Accesso come <span className="font-medium text-ink">{session.user.email}</span></p>
            <button type="button" onClick={logout} disabled={busy} className={secondary}>{busy ? "Uscita…" : "Esci"}</button>
          </div>
          <ContributorWorkspace key={session.user.id} client={client} subjects={subjects} studyEnabled={studyEnabled} />
        </>
      ) : (
        <form onSubmit={login} className="max-w-lg rounded-2xl border border-border bg-white p-6 sm:p-8" aria-busy={busy}>
          <h2 className="text-xl font-semibold">Accedi per contribuire</h2>
          <p className="mt-3 text-sm leading-6 text-muted">L’accesso è riservato ai collaboratori abilitati. I materiali pubblici non richiedono un account.</p>
          <fieldset disabled={busy} className="mt-6 space-y-5">
            <legend className="sr-only">Credenziali del collaboratore</legend>
            <label className="block text-sm font-medium">Email<input className={field} name="email" type="email" autoComplete="username" required maxLength={254} /></label>
            <label className="block text-sm font-medium">Password<input className={field} name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
            <button className={button} type="submit">{busy ? "Accesso…" : "Accedi"}</button>
          </fieldset>
        </form>
      )}
    </div>
  );
}

function ContributorWorkspace({ client, subjects, studyEnabled }: { client: SupabaseClient<UploadDatabase>; subjects: SubjectOption[]; studyEnabled: boolean }) {
  const repository = useMemo(() => createUploadsRepository(client), [client]);
  const studies = useMemo(() => createWebStudyRepository(client), [client]);
  const [jobs, setJobs] = useState<Record<string, StudyJobSummary>>({});
  const [openStudy, setOpenStudy] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);
  const hasRunningJob = Object.values(jobs).some((job) => job.status === "processing" && !jobExpired(job, clock));

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const enabled = await repository.canContribute();
        const rows = enabled ? await repository.list() : [];
        if (active) { setAllowed(enabled); setItems(rows); }
        if (enabled && studyEnabled) {
          const collected = await studies.list(rows.map((r) => r.id));
          if (active) setJobs(Object.fromEntries(collected.map((j) => [j.upload_id, j])));
        }
      } catch (err) { if (active) setError(err instanceof WebStudyClientError ? err.message : uploadError(err)); }
    }
    void load();
    return () => { active = false; };
  }, [repository, studies, studyEnabled]);

  useEffect(() => {
    if (!studyEnabled || !allowed || !hasRunningJob) return;
    let active = true, inFlight = false;
    const timer = window.setInterval(async () => {
      if (document.visibilityState === "hidden" || inFlight) return;
      inFlight = true;
      try {
        const collected = await studies.list(items.map((r) => r.id));
        if (active) setJobs(Object.fromEntries(collected.map((j) => [j.upload_id, j])));
      } catch { if (active) setError("Impossibile aggiornare le elaborazioni. Riprova con Aggiorna elenco."); }
      finally { inFlight = false; if (active) setClock(Date.now()); }
    }, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [studies, items, allowed, studyEnabled, hasRunningJob]);

  async function refresh() {
    const enabled = await repository.canContribute();
    setAllowed(enabled);
    const rows = enabled ? await repository.list() : [];
    setItems(rows);
    if (enabled && studyEnabled) {
      const collected = await studies.list(rows.map((r) => r.id));
      setJobs(Object.fromEntries(collected.map((j) => [j.upload_id, j]))); setClock(Date.now());
    }
  }

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(success); }
    catch (err) { setError(err instanceof WebStudyClientError ? err.message : uploadError(err)); }
    finally {
      try { await refresh(); } catch { setError((previous) => previous || "Impossibile aggiornare l’elenco. Riprova con Aggiorna elenco."); }
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("pdf");
    if (!(file instanceof File)) { setError("Scegli un file PDF."); return; }
    await run(async () => {
      const saved = await repository.add({ subjectSlug: String(data.get("subject")), title: String(data.get("title")), authorName: String(data.get("author")), rightsConfirmed: data.get("rights") === "on" }, file, subjects.map((s) => s.slug));
      form.reset();
      if (studyEnabled) {
        try { await studies.start(saved.id); }
        catch (err) { setError(`PDF salvato. ${err instanceof WebStudyClientError ? err.message : "Generazione non avviata. Puoi richiederla dall’elenco."}`); }
      }
    }, "PDF salvato nell’archivio riservato. Puoi ritrovarlo nell’elenco e scaricarlo.");
  }

  async function download(item: Upload) {
    await run(async () => {
      const blob = await repository.download(item);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = item.original_name;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "File ricevuto dall’archivio. Il browser gestisce il download.");
  }

  return (
    <div aria-busy={busy}>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">{notice}</p>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{allowed === null ? "Verifica dell’abilitazione…" : allowed ? "Archivio privato dei tuoi contributi" : "Il tuo account non è ancora abilitato al caricamento. Contatta l’amministratore."}</p>
        <button type="button" disabled={busy} className={secondary} onClick={() => run(async () => {}, "Elenco aggiornato.")}>Aggiorna elenco</button>
      </div>
      {allowed && (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <form onSubmit={submit} className="min-w-0 rounded-2xl border border-border bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Carica i tuoi appunti</h2>
            <p id="upload-help" className="mt-3 text-sm leading-6 text-muted">Un PDF per volta, massimo 5 MB. Sono accettati anche appunti incompleti. Non chiudere la pagina durante l’invio.</p>
            <p className="mt-3 text-sm leading-6 text-muted">{studyEnabled ? "Dopo il salvataggio parte la generazione sul server: fino a quattro pagine selezionate, sei flashcard e quattro quesiti. Massimo cinque nuove elaborazioni in 24 ore per account; le raccolte pronte vengono riutilizzate." : "La generazione automatica non è ancora attiva su questa versione del sito. Puoi comunque salvare i tuoi PDF."}</p>
            {studyEnabled && <p className="mt-3 text-sm leading-6 text-muted">Per preparare le attività, le pagine testuali selezionate vengono inviate al servizio AI Cloudflare. I risultati restano nel tuo archivio privato.</p>}
            <fieldset disabled={busy} aria-describedby="upload-help" className="mt-6 space-y-5">
              <legend className="sr-only">Dati del contributo</legend>
              <div className="text-sm font-medium"><label htmlFor="upload-subject">Insegnamento</label><select id="upload-subject" name="subject" className={field} required defaultValue=""><option value="" disabled>Scegli l’insegnamento</option>{subjects.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}</select></div>
              <label className="block text-sm font-medium">Titolo del materiale<input name="title" className={field} required minLength={3} maxLength={160} placeholder="Es. Appunti delle prime lezioni" /></label>
              <label className="block text-sm font-medium">Autore degli appunti<input name="author" className={field} required minLength={2} maxLength={120} autoComplete="name" /></label>
              <label className="block text-sm font-medium">File PDF<input name="pdf" type="file" accept="application/pdf,.pdf" required className={`${field} min-w-0 max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2`} /></label>
              <label className="flex items-start gap-3 text-sm leading-6"><input name="rights" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-accent" /><span>Confermo di poter condividere questo materiale e di non includere dati personali di altre persone.</span></label>
              <button type="submit" className={`${button} w-full`}>{busy ? "Operazione in corso…" : "Salva PDF nell’archivio"}</button>
            </fieldset>
          </form>
          <section aria-labelledby="my-uploads" className="min-w-0">
            <h2 id="my-uploads" className="text-xl font-semibold">I tuoi caricamenti</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Gli ultimi 100 contributi del tuo account. Non sono ancora visibili nel catalogo pubblico.</p>
            {items.length === 0 ? <p className="mt-5 rounded-2xl border border-border bg-white p-6">Non hai ancora caricato materiali.</p> : (
              <ul className="mt-5 space-y-4">
                {items.map((item) => {
                  const job = jobs[item.id];
                  const expired = job ? jobExpired(job, clock) : false;
                  return (
                  <li key={item.id} className="min-w-0 rounded-2xl border border-border bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.status === "stored" ? "Salvato · privato" : "Caricamento incompleto"}</p>
                    <h3 className="mt-2 break-words text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 break-words text-sm leading-6 text-muted">{subjects.find((s) => s.slug === item.subject_slug)?.title ?? item.subject_slug} · {item.author_name}</p>
                    <p className="mt-1 break-all text-sm leading-6 text-muted">{item.original_name} · {new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(item.byte_size / 1024 / 1024)} MB</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.status === "stored" ? <button type="button" disabled={busy} className={secondary} onClick={() => download(item)}>Scarica PDF</button> : <button type="button" disabled={busy} className={secondary} onClick={() => run(async () => { await repository.complete(item.id); if (studyEnabled) await studies.start(item.id); }, "Salvataggio verificato.")}>Verifica salvataggio</button>}
                      {item.status === "stored" && studyEnabled && (job?.status === "ready" ? (
                        <button type="button" disabled={busy} aria-expanded={openStudy === item.id} className={secondary} onClick={() => setOpenStudy(openStudy === item.id ? null : item.id)}>{openStudy === item.id ? "Chiudi strumenti" : "Apri strumenti di studio"}</button>
                      ) : (
                        <button type="button" disabled={busy || (job?.status === "processing" && !expired)} className={secondary} onClick={() => run(() => studies.start(item.id).then(() => {}), "Elaborazione richiesta. I risultati saranno salvati automaticamente.")}>{job?.status === "processing" && !expired ? "Generazione in corso…" : job ? "Riprova generazione" : "Genera strumenti di studio"}</button>
                      ))}
                      <button type="button" disabled={busy} className={secondary} onClick={() => setToDelete(item.id)}>Elimina</button>
                    </div>
                    {studyEnabled && job?.status === "processing" && !expired && <p role="status" className="mt-3 text-sm leading-6 text-muted">Elaborazione sul server. Puoi cambiare pagina e tornare qui: i risultati restano nel tuo archivio.</p>}
                    {studyEnabled && (job?.status === "failed" || expired) && <p className="mt-3 text-sm leading-6 text-red-900">{studyErrorMessage(expired ? "expired" : job?.error_code ?? null)}</p>}
                    {job?.status === "ready" && openStudy === item.id && <UploadedStudySession key={job.id} client={client} upload={item} jobId={job.id} />}
                    {toDelete === item.id && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm leading-6 text-red-900">Eliminare “{item.title}” dall’archivio? Questa operazione rimuove anche il PDF.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" disabled={busy} className={button} onClick={() => run(async () => { await repository.remove(item); setToDelete(null); }, "Contributo eliminato.")}>Conferma eliminazione</button>
                          <button type="button" disabled={busy} className={secondary} onClick={() => setToDelete(null)}>Annulla</button>
                        </div>
                      </div>
                    )}
                  </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
