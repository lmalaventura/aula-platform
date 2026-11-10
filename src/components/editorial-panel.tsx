"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ContributionRow, EditorDraftView } from "@/lib/editor/types";
const action =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium hover:bg-emerald-50 disabled:opacity-50";
const primary = `${action} bg-ink text-white hover:bg-accent`;
const field =
  "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-3 py-2 text-base";
const decisions = {
  pending: "Da revisionare",
  approved: "Approvata",
  excluded: "Esclusa",
};
export function EditorialPanel({
  drafts,
  token,
}: {
  drafts: EditorDraftView[];
  token: string;
}) {
  const router = useRouter(),
    [subject, setSubject] = useState(drafts[0]?.subjectSlug ?? ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [confirmed, setConfirmed] = useState(false),
    [partial, setPartial] = useState(false),
    [contributions, setContributions] = useState<ContributionRow[] | null>(
      null,
    );
  const draft = drafts.find((d) => d.subjectSlug === subject),
    ready = draft?.units.filter((u) => u.kit) ?? [],
    approved = ready.filter((u) => u.review?.decision === "approved").length;
  async function request(body: object) {
    const response = await fetch("/api/redazione", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Aula-Editor": token },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "Operazione non riuscita.");
    }
    return response;
  }
  async function run(work: () => Promise<void>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      setNotice(message);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operazione non riuscita.");
    } finally {
      setBusy(false);
    }
  }
  async function reloadContributions() {
    const response = await request({ action: "listContributions" });
    setContributions(await response.json());
  }
  async function download(id: string) {
    const r = await request({ action: "downloadContribution", id }),
      url = URL.createObjectURL(await r.blob()),
      a = document.createElement("a");
    a.href = url;
    a.download = "contributo.pdf";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="mt-8 min-w-0 [overflow-wrap:anywhere]" aria-busy={busy}>
      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-950"
        >
          {notice}
        </p>
      )}
      <section aria-labelledby="editor-study">
        <h2 id="editor-study" className="text-2xl font-semibold">
          Attività condivise
        </h2>
        {drafts.length ? (
          <div className="mt-4 text-sm font-medium">
            <label htmlFor="editor-subject">Insegnamento</label>
            <select
              id="editor-subject"
              className={field}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setConfirmed(false);
              }}
            >
              {drafts.map((d) => (
                <option key={d.subjectSlug} value={d.subjectSlug}>
                  {d.source.subjectTitle}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="mt-4 leading-8 text-muted">
            Non ci sono bozze. Esegui study:prepare per la materia, poi aggiorna
            questa pagina. Le istruzioni sono in docs/STUDIO_CONDIVISO.md.
          </p>
        )}
        {draft && (
          <>
            <p className="mt-4 text-sm leading-7 text-muted">
              Fonte: {draft.source.title}. Raccolte pronte: {ready.length};
              approvate: {approved}. Le parti tecniche qui sotto servono alla
              revisione e non vengono mostrate agli studenti.
            </p>
            {draft.stale && (
              <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4">
                La fonte è cambiata. Ripeti study:prepare prima di approvare o
                pubblicare.
              </p>
            )}
            <div className="mt-5 rounded-2xl border border-border bg-white p-5">
              <label className="flex items-start gap-3 text-sm leading-7">
                <input
                  className="mt-1.5 h-4 w-4 shrink-0"
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                  Confermo di aver controllato fonte, risposte e spiegazioni
                  delle raccolte che approvo.
                </span>
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className={action}
                  disabled={busy || !confirmed || !ready.length || draft.stale}
                  onClick={() =>
                    run(async () => {
                      await request({
                        action: "reviewAll",
                        subject,
                        confirmed,
                        sourceSha256: draft.source.sha256,
                        units: ready
                          .filter((u) => u.review?.decision !== "excluded")
                          .map((u) => ({ id: u.id, digest: u.digest })),
                      });
                    }, "Raccolte pronte confermate. Le esclusioni sono state mantenute.")
                  }
                >
                  Approva le raccolte controllate
                </button>
              </div>
              <label className="mt-5 flex items-start gap-3 text-sm leading-7">
                <input
                  className="mt-1.5 h-4 w-4 shrink-0"
                  type="checkbox"
                  checked={partial}
                  onChange={(e) => setPartial(e.target.checked)}
                />
                <span>
                  Consenti una pubblicazione parziale: includi soltanto le
                  raccolte già approvate.
                </span>
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className={primary}
                  disabled={busy || !confirmed || !approved || draft.stale}
                  onClick={() =>
                    run(async () => {
                      await request({
                        action: "publish",
                        subject,
                        confirmed,
                        allowPartial: partial,
                      });
                    }, "Banca pubblicata nel progetto. Verifica la pagina di studio, poi commit e push renderanno disponibile la versione online.")
                  }
                >
                  Pubblica nel progetto
                </button>
                <a
                  className={action}
                  href={`/insegnamenti/${subject}/studio`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apri lo studio pubblico
                </a>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {draft.topics.map((topic) => (
                <details
                  key={topic.id}
                  className="rounded-2xl border border-border bg-white p-5"
                >
                  <summary className="cursor-pointer text-lg font-semibold">
                    {topic.title}
                  </summary>
                  <form
                    className="mt-4"
                    onSubmit={(e: FormEvent<HTMLFormElement>) => {
                      e.preventDefault();
                      const title = String(
                        new FormData(e.currentTarget).get("title"),
                      );
                      void run(async () => {
                        await request({
                          action: "rename",
                          subject,
                          id: topic.id,
                          title,
                        });
                      }, "Macroargomento aggiornato. Titoli uguali vengono raggruppati nella banca pubblicata.");
                    }}
                  >
                    <label className="block text-sm font-medium">
                      Nome del macroargomento
                      <input
                        className={field}
                        name="title"
                        defaultValue={topic.title}
                        minLength={3}
                        maxLength={160}
                        required
                      />
                    </label>
                    <button
                      className={`${action} mt-3`}
                      disabled={busy || draft.stale}
                    >
                      Salva nome
                    </button>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Usa lo stesso nome per unire più gruppi, ad esempio
                      Ottimizzazione.
                    </p>
                  </form>
                  <div className="mt-5 space-y-4">
                    {draft.units
                      .filter((u) => u.topicId === topic.id)
                      .map((u) => (
                        <details
                          key={u.id}
                          className="rounded-xl border border-border p-4"
                        >
                          <summary className="cursor-pointer font-medium">
                            {u.kit?.title ?? u.title} ·{" "}
                            {u.kit
                              ? decisions[u.review?.decision ?? "pending"]
                              : u.state === "insufficient"
                                ? "Testo insufficiente"
                                : "Da preparare"}
                          </summary>
                          <p className="mt-3 text-sm text-muted">
                            Pagine fisiche: {u.pages.join(", ")}
                          </p>
                          {u.kit && (
                            <>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {(
                                  ["approved", "excluded", "pending"] as const
                                ).map((decision) => (
                                  <button
                                    key={decision}
                                    className={action}
                                    disabled={busy || draft.stale}
                                    onClick={() =>
                                      run(async () => {
                                        await request({
                                          action: "review",
                                          subject,
                                          id: u.id,
                                          decision,
                                          digest: u.digest,
                                        });
                                      }, "Revisione salvata.")
                                    }
                                  >
                                    {decisions[decision]}
                                  </button>
                                ))}
                              </div>
                              <h3 className="mt-5 font-semibold">Flashcard</h3>
                              <ol className="mt-3 space-y-4">
                                {u.kit.flashcards.map((c, i) => (
                                  <li key={i}>
                                    <p className="font-medium">{c.front}</p>
                                    <p className="mt-2 leading-7">{c.back}</p>
                                    <blockquote className="mt-2 text-sm leading-7 text-muted">
                                      {c.quote}
                                    </blockquote>
                                    <a
                                      className="inline-flex min-h-12 items-center text-sm text-accent underline"
                                      href={`${draft.source.fileUrl}#page=${c.page}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Fonte · pagina {c.page}
                                    </a>
                                  </li>
                                ))}
                              </ol>
                              <h3 className="mt-5 font-semibold">Quiz</h3>
                              <ol className="mt-3 space-y-5">
                                {u.kit.quiz.map((q, i) => (
                                  <li key={i}>
                                    <p className="font-medium">{q.question}</p>
                                    <ul className="mt-2 space-y-1">
                                      {q.choices.map((c, n) => (
                                        <li
                                          key={n}
                                          className="text-sm leading-7"
                                        >
                                          {n === q.correctIndex
                                            ? "Corretta: "
                                            : "Alternativa: "}
                                          {c}
                                        </li>
                                      ))}
                                    </ul>
                                    <p className="mt-2 leading-7">
                                      {q.explanation}
                                    </p>
                                    <blockquote className="mt-2 text-sm leading-7 text-muted">
                                      {q.quote}
                                    </blockquote>
                                    <a
                                      className="inline-flex min-h-12 items-center text-sm text-accent underline"
                                      href={`${draft.source.fileUrl}#page=${q.page}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Fonte · pagina {q.page}
                                    </a>
                                  </li>
                                ))}
                              </ol>
                            </>
                          )}
                        </details>
                      ))}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </section>
      <section
        aria-labelledby="editor-contributions"
        className="mt-10 border-t border-border pt-8"
      >
        <h2 id="editor-contributions" className="text-2xl font-semibold">
          Proposte degli studenti
        </h2>
        <p className="mt-3 leading-8 text-muted">
          Accettare una proposta la rende disponibile per l’integrazione
          editoriale. La fonte comune si aggiorna dopo la revisione del
          documento; nessun PDF viene unito automaticamente.
        </p>
        <button
          className={`${action} mt-4`}
          disabled={busy}
          onClick={() => run(reloadContributions, "Proposte aggiornate.")}
        >
          Carica proposte
        </button>
        {contributions && (
          <div className="mt-5 space-y-4">
            {!contributions.length && <p>Non ci sono proposte.</p>}
            {contributions.map((row) => (
              <form
                key={row.id}
                className="rounded-2xl border border-border bg-white p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void run(async () => {
                    await request({
                      action: "reviewContribution",
                      id: row.id,
                      status: data.get("status"),
                      note: data.get("note"),
                    });
                    await reloadContributions();
                  }, "Valutazione inviata all’autore.");
                }}
              >
                <h3 className="font-semibold">{row.title}</h3>
                <p className="mt-2 text-sm text-muted">
                  {row.subject_slug} · {row.author_name} · {row.original_name}
                </p>
                <button
                  className={`${action} mt-3`}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() => download(row.id), "Download avviato.")
                  }
                >
                  Scarica proposta
                </button>
                <div className="mt-4 text-sm font-medium">
                  <label htmlFor={`review-${row.id}`}>Esito</label>
                  <select
                    id={`review-${row.id}`}
                    className={field}
                    name="status"
                    defaultValue={row.status}
                  >
                    <option value="pending">Da revisionare</option>
                    <option value="accepted">Accettato per integrazione</option>
                    <option value="changes_requested">
                      Modifiche richieste
                    </option>
                    <option value="rejected">Non accolto</option>
                  </select>
                </div>
                <label className="mt-4 block text-sm font-medium">
                  Messaggio all’autore
                  <textarea
                    aria-label="Messaggio all’autore"
                    className={field}
                    name="note"
                    defaultValue={row.note}
                    maxLength={2000}
                    rows={3}
                  />
                </label>
                <button className={`${action} mt-3`} disabled={busy}>
                  Salva valutazione
                </button>
              </form>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
