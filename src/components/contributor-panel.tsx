"use client";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserUploadClient } from "@/lib/uploads/browser-client";
import { createUploadsRepository, uploadError } from "@/lib/uploads/repository";
import type {
  ContributionReview,
  Upload,
  UploadDatabase,
} from "@/lib/uploads/types";
export type SubjectOption = { slug: string; title: string };
const field =
  "mt-2 block min-h-12 w-full rounded-xl border border-border bg-white px-3 py-2 text-base";
const action =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium hover:bg-emerald-50 disabled:opacity-50";
const primary = `${action} bg-ink text-white hover:bg-accent`;
const reviewLabels = {
  pending: "In attesa di revisione",
  accepted: "Accettato per integrazione",
  changes_requested: "Modifiche richieste",
  rejected: "Non accolto",
};
export function ContributorPanel({
  config,
  subjects,
  onBusyChange,
}: {
  config: { url: string; key: string };
  subjects: SubjectOption[];
  onBusyChange?: (busy: boolean) => void;
}) {
  const [connection, setConnection] = useState<{
    client: SupabaseClient<UploadDatabase>;
    session: Session | null;
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [childBusy, setChildBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const client = getBrowserUploadClient(config);
    const { data } = client.auth.onAuthStateChange((_event, session) =>
      setConnection({ client, session }),
    );
    return () => data.subscription.unsubscribe();
  }, [config]);
  useEffect(() => {
    onBusyChange?.(busy || childBusy);
  }, [busy, childBusy, onBusyChange]);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!connection) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const r = await connection.client.auth.signInWithPassword({
        email: String(data.get("email")).trim(),
        password: String(data.get("password")),
      });
      if (r.error) throw r.error;
    } catch {
      setError(
        "Accesso non riuscito. Controlla le credenziali del tuo account collaboratore.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (!connection) return;
    setBusy(true);
    try {
      const r = await connection.client.auth.signOut({ scope: "local" });
      if (r.error) throw r.error;
    } catch {
      setError("Uscita non riuscita. Riprova.");
    } finally {
      setBusy(false);
    }
  }
  if (!connection) return <p role="status">Controllo dell’accesso…</p>;
  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      {connection.session ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="break-all text-sm text-muted">
              {connection.session.user.email}
            </p>
            <button
              type="button"
              className={action}
              disabled={busy || childBusy}
              onClick={logout}
            >
              Esci
            </button>
          </div>
          <ContributionForm
            key={connection.session.user.id}
            client={connection.client}
            subjects={subjects}
            onBusyChange={setChildBusy}
          />
        </>
      ) : (
        <form onSubmit={login}>
          <p className="mb-5 text-sm leading-7 text-muted">
            Per inviare contributi serve un account collaboratore abilitato
            dalla redazione. Appunti, quiz e flashcard pubblicati sono
            consultabili senza accesso.
          </p>
          <fieldset disabled={busy} className="space-y-4">
            <legend className="sr-only">Accesso collaboratore</legend>
            <label className="block text-sm font-medium">
              Email
              <input
                className={field}
                type="email"
                name="email"
                required
                autoComplete="username"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                className={field}
                type="password"
                name="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button className={primary}>{busy ? "Accesso…" : "Accedi"}</button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
function ContributionForm({
  client,
  subjects,
  onBusyChange,
}: {
  client: SupabaseClient<UploadDatabase>;
  subjects: SubjectOption[];
  onBusyChange?: (busy: boolean) => void;
}) {
  const repository = useMemo(() => createUploadsRepository(client), [client]);
  const subjectId = useId();
  const [allowed, setAllowed] = useState<boolean | null>(null),
    [items, setItems] = useState<Upload[]>([]),
    [reviews, setReviews] = useState<ContributionReview[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [toDelete, setToDelete] = useState<string | null>(null);
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const enabled = await repository.canContribute();
        const rows = enabled ? await repository.list() : [];
        if (!active) return;
        setAllowed(enabled);
        setItems(rows);
        const r = await repository.reviews(rows.map((i) => i.id));
        if (active) setReviews(r);
      } catch (e) {
        if (active) setError(uploadError(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [repository]);
  async function refresh() {
    const rows = await repository.list();
    setItems(rows);
    setReviews(await repository.reviews(rows.map((i) => i.id)));
  }
  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refresh();
      setNotice(message);
    } catch (e) {
      setError(uploadError(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      input = new FormData(form),
      file = input.get("pdf");
    if (!(file instanceof File)) return;
    await run(async () => {
      await repository.add(
        {
          subjectSlug: String(input.get("subject")),
          title: String(input.get("title")),
          authorName: String(input.get("author")),
          rightsConfirmed: input.get("rights") === "on",
        },
        file,
        subjects.map((s) => s.slug),
      );
      form.reset();
    }, "Contributo inviato e in attesa di revisione.");
  }
  async function download(item: Upload) {
    await run(async () => {
      const blob = await repository.download(item),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = item.original_name;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "Download avviato.");
  }
  return (
    <div aria-busy={busy}>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-950"
        >
          {notice}
        </p>
      )}
      {allowed === null ? (
        <p role="status">Verifica dell’abilitazione…</p>
      ) : !allowed ? (
        <p>Il tuo account non è ancora abilitato all’invio di contributi.</p>
      ) : (
        <>
          <form onSubmit={submit}>
            <p className="mb-4 text-sm leading-7 text-muted">
              Proponi un’integrazione agli appunti condivisi o un materiale
              utile. La redazione valuterà il contributo prima dell’integrazione
              o della pubblicazione.
            </p>
            <fieldset disabled={busy} className="space-y-4">
              <legend className="sr-only">Nuovo contributo</legend>
              <div className="text-sm font-medium">
                <label htmlFor={subjectId}>Insegnamento</label>
                <select
                  id={subjectId}
                  name="subject"
                  className={field}
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Scegli l’insegnamento
                  </option>
                  {subjects.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <label className="block text-sm font-medium">
                Titolo del contributo
                <input
                  className={field}
                  name="title"
                  minLength={3}
                  maxLength={160}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Autore
                <input
                  className={field}
                  name="author"
                  minLength={2}
                  maxLength={120}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                File PDF · massimo 5 MB
                <input
                  className={`${field} min-w-0 max-w-full text-sm`}
                  type="file"
                  name="pdf"
                  accept="application/pdf,.pdf"
                  required
                />
              </label>
              <label className="flex items-start gap-3 text-sm leading-7">
                <input
                  name="rights"
                  type="checkbox"
                  className="mt-1.5 h-4 w-4 shrink-0"
                  required
                />
                <span>
                  Confermo di poter condividere il materiale e di non includere
                  dati personali di altre persone.
                </span>
              </label>
              <button className={primary}>
                {busy ? "Invio…" : "Invia alla redazione"}
              </button>
            </fieldset>
          </form>
          <details className="mt-7 border-t border-border pt-4">
            <summary className="cursor-pointer font-medium">
              I miei contributi ({items.length})
            </summary>
            <button
              type="button"
              className={`${action} mt-3`}
              disabled={busy}
              onClick={() => run(async () => {}, "Elenco aggiornato.")}
            >
              Aggiorna elenco
            </button>
            <ul className="mt-4 space-y-4">
              {items.map((item) => {
                const review = reviews.find((r) => r.upload_id === item.id);
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border p-4"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm text-muted">
                      {item.status === "uploading"
                        ? "Caricamento incompleto"
                        : reviewLabels[review?.status ?? "pending"]}
                    </p>
                    {review?.note && (
                      <p className="mt-2 text-sm leading-7">{review.note}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.status === "stored" ? (
                        <button
                          type="button"
                          className={action}
                          disabled={busy}
                          onClick={() => download(item)}
                        >
                          Scarica PDF
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={action}
                          disabled={busy}
                          onClick={() =>
                            run(
                              () => repository.complete(item.id),
                              "Invio verificato.",
                            )
                          }
                        >
                          Verifica invio
                        </button>
                      )}
                      <button
                        type="button"
                        className={action}
                        disabled={busy}
                        onClick={() => setToDelete(item.id)}
                      >
                        Ritira contributo
                      </button>
                    </div>
                    {toDelete === item.id && (
                      <div className="mt-3 rounded-xl bg-red-50 p-4">
                        <p className="text-sm leading-7">
                          Ritirare il contributo e rimuovere il PDF inviato?
                          Eventuali integrazioni già redatte negli appunti
                          condivisi rimangono nella fonte comune.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={action}
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await repository.remove(item);
                                setToDelete(null);
                              }, "Contributo ritirato.")
                            }
                          >
                            Conferma ritiro
                          </button>
                          <button
                            type="button"
                            className={action}
                            onClick={() => setToDelete(null)}
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
