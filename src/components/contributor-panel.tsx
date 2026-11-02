"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserUploadClient } from "@/lib/uploads/browser-client";
import { createUploadsRepository, uploadError } from "@/lib/uploads/repository";
import type { Upload, UploadDatabase } from "@/lib/uploads/types";

type SubjectOption = { slug: string; title: string };
const field = "mt-2 block min-h-12 w-full rounded-xl border border-border bg-white px-3 py-2 text-base";
const button = "inline-flex min-h-12 items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-accent disabled:cursor-wait disabled:opacity-60";
const secondary = "inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60";

export function ContributorPanel({ config, subjects }: {
  config: { url: string; key: string }; subjects: SubjectOption[];
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
          <ContributorWorkspace key={session.user.id} client={client} subjects={subjects} />
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

function ContributorWorkspace({ client, subjects }: { client: SupabaseClient<UploadDatabase>; subjects: SubjectOption[] }) {
  const repository = useMemo(() => createUploadsRepository(client), [client]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const enabled = await repository.canContribute();
        const rows = enabled ? await repository.list() : [];
        if (active) { setAllowed(enabled); setItems(rows); }
      } catch (err) { if (active) setError(uploadError(err)); }
    }
    void load();
    return () => { active = false; };
  }, [repository]);

  async function refresh() {
    const enabled = await repository.canContribute();
    setAllowed(enabled);
    setItems(enabled ? await repository.list() : []);
  }

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(success); }
    catch (err) { setError(uploadError(err)); }
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
      await repository.add({ subjectSlug: String(data.get("subject")), title: String(data.get("title")), authorName: String(data.get("author")), rightsConfirmed: data.get("rights") === "on" }, file, subjects.map((s) => s.slug));
      form.reset();
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
                {items.map((item) => (
                  <li key={item.id} className="min-w-0 rounded-2xl border border-border bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.status === "stored" ? "Salvato · privato" : "Caricamento incompleto"}</p>
                    <h3 className="mt-2 break-words text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 break-words text-sm leading-6 text-muted">{subjects.find((s) => s.slug === item.subject_slug)?.title ?? item.subject_slug} · {item.author_name}</p>
                    <p className="mt-1 break-all text-sm leading-6 text-muted">{item.original_name} · {new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(item.byte_size / 1024 / 1024)} MB</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.status === "stored" ? <button type="button" disabled={busy} className={secondary} onClick={() => download(item)}>Scarica PDF</button> : <button type="button" disabled={busy} className={secondary} onClick={() => run(() => repository.complete(item.id), "Salvataggio verificato.")}>Verifica salvataggio</button>}
                      <button type="button" disabled={busy} className={secondary} onClick={() => setToDelete(item.id)}>Elimina</button>
                    </div>
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
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
