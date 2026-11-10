"use client";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { StudyBank } from "@/lib/study/bank";
import {
  answerAttempt,
  attemptReport,
  finishAttempt,
  moveAttempt,
  practicePool,
  startAttempt,
} from "@/lib/study/practice";
import { createPracticeStore } from "@/lib/study/practice-store";
const action = "button-secondary";
const primary = "button-primary";
export function ExamPractice({
  bank,
  scope = "",
  demo = false,
}: {
  bank: StudyBank;
  scope?: string;
  demo?: boolean;
}) {
  const store = useMemo(
    () => createPracticeStore(bank, { demo }),
    [bank, demo],
  );
  const snapshot = useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getServerSnapshot,
    ),
    state = snapshot.state;
  const [show, setShow] = useState(false),
    [onlyWrong, setOnlyWrong] = useState(false),
    [count, setCount] = useState(10),
    [minutes, setMinutes] = useState(20),
    [now, setNow] = useState(() => Date.now()),
    [error, setError] = useState("");
  const countId = useId(),
    timeId = useId(),
    wrongId = useId(),
    radio = useId(),
    field = useRef<HTMLFieldSetElement>(null),
    resultTitle = useRef<HTMLHeadingElement>(null);
  const active = state.active,
    last = state.last,
    pool = practicePool(bank, scope, onlyWrong ? state.wrongIds : undefined),
    amount = Math.min(Math.max(1, count), pool.length);
  const activeId = active?.id,
    activePosition = active?.position,
    lastId = last?.id;
  const title = (topic: string) =>
    bank.topics.find((t) => t.id === topic)?.title ??
    "Tutti gli argomenti disponibili";
  useEffect(() => {
    store.expire(Date.now());
    if (!activeId) return;
    const timer = setInterval(() => {
      const next = Date.now();
      setNow(next);
      store.expire(next);
    }, 1000);
    return () => clearInterval(timer);
  }, [store, activeId]);
  useEffect(() => {
    if (show && activeId) field.current?.focus();
    else if (show && lastId) resultTitle.current?.focus();
  }, [show, activeId, activePosition, lastId]);
  function run(work: () => void) {
    try {
      work();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operazione non riuscita.");
    }
  }
  function start(wrongOnly = onlyWrong, allWrong = false) {
    run(() => {
      const selectedScope = allWrong ? "" : scope,
        available = practicePool(
          bank,
          selectedScope,
          wrongOnly ? state.wrongIds : undefined,
        );
      const startedAt = Date.now();
      setNow(startedAt);
      store.update((current) =>
        startAttempt(current, bank, {
          id: crypto.randomUUID(),
          scope: selectedScope,
          count: allWrong ? available.length : amount,
          minutes: allWrong ? 0 : minutes,
          now: startedAt,
          wrongOnly,
        }),
      );
      setShow(true);
    });
  }
  const report = last ? attemptReport(bank, last) : null;
  const question = active
    ? bank.quiz.find((q) => q.id === active.questionIds[active.position])!
    : null;
  const remaining = active?.deadline
    ? Math.max(0, Math.ceil((active.deadline - now) / 1000))
    : null;
  return (
    <section
      className="mt-6 min-w-0 [overflow-wrap:anywhere]"
      aria-label="Allenamento in modalità esame"
    >
      {demo && (
        <p className="mb-5 rounded-xl border border-dashed border-border bg-white p-4 font-medium">
          Demo tecnica: domande sull’utilizzo del sito, non su una materia.
          Risultati separati da quelli di studio.
        </p>
      )}
      <p className="text-sm leading-7 text-muted">
        Allenamento personale, con correzione alla fine. Non riproduce le regole
        dell’esame.
      </p>
      {!snapshot.ready ? (
        <p className="mt-4" role="status">
          Caricamento della sessione locale…
        </p>
      ) : (
        <>
          {snapshot.notice && (
            <p
              className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-7"
              role="status"
            >
              {snapshot.notice}
            </p>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
          {show && active && question ? (
            <>
              <h2 className="mt-6 text-2xl font-semibold">Sessione in corso</h2>
              <p className="mt-3 text-sm leading-7">
                {title(active.scope)} · Domanda {active.position + 1} di{" "}
                {active.questionIds.length}
              </p>
              <p
                className="mt-2 font-mono text-lg"
                role="timer"
                aria-live="off"
              >
                {remaining === null
                  ? "Senza limite di tempo"
                  : `Tempo restante: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
              </p>
              {remaining !== null && remaining > 0 && remaining <= 60 && (
                <p className="mt-2 text-sm text-amber-900" role="status">
                  Ultimo minuto disponibile.
                </p>
              )}
              <p className="mt-3 text-sm text-muted">
                Risposte: {Object.keys(active.answers).length} di{" "}
                {active.questionIds.length}
              </p>
              <progress
                className="mt-2 h-2 w-full accent-accent"
                value={Object.keys(active.answers).length}
                max={active.questionIds.length}
                aria-label="Domande risposte nell'allenamento"
              />
              <fieldset
                ref={field}
                tabIndex={-1}
                className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-8"
              >
                <legend className="px-2 text-xl font-semibold leading-8">
                  {question.question}
                </legend>
                <div className="mt-4 space-y-3">
                  {question.choices.map((choice, i) => (
                    <label
                      key={i}
                      className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border p-4 leading-7"
                    >
                      <input
                        className="mt-1.5 h-4 w-4 shrink-0 accent-accent"
                        type="radio"
                        name={radio}
                        checked={active.answers[question.id] === i}
                        onChange={() =>
                          run(() =>
                            store.update((s) =>
                              answerAttempt(s, bank, active.id, i, Date.now()),
                            ),
                          )
                        }
                      />
                      <span>{choice}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className={action}
                  disabled={active.position === 0}
                  onClick={() =>
                    store.update((s) =>
                      moveAttempt(s, active.id, active.position - 1),
                    )
                  }
                >
                  Precedente
                </button>
                <button
                  className={action}
                  disabled={active.position === active.questionIds.length - 1}
                  onClick={() =>
                    store.update((s) =>
                      moveAttempt(s, active.id, active.position + 1),
                    )
                  }
                >
                  Successiva
                </button>
                <button
                  className={action}
                  disabled={
                    Object.keys(active.answers).length ===
                    active.questionIds.length
                  }
                  onClick={() => {
                    const position = active.questionIds.findIndex(
                      (id, i) =>
                        i > active.position && active.answers[id] === undefined,
                    );
                    const first = active.questionIds.findIndex(
                      (id) => active.answers[id] === undefined,
                    );
                    store.update((s) =>
                      moveAttempt(
                        s,
                        active.id,
                        position >= 0 ? position : first,
                      ),
                    );
                  }}
                >
                  Vai a una non risposta
                </button>
                <button
                  className={primary}
                  onClick={() =>
                    store.update((s) =>
                      finishAttempt(
                        s,
                        bank,
                        active.id,
                        Date.now(),
                        "submitted",
                      ),
                    )
                  }
                >
                  Termina e correggi
                </button>
              </div>
              <button
                className={`${action} mt-4`}
                onClick={() => setShow(false)}
              >
                Continua più tardi
              </button>
              <p className="mt-3 text-sm leading-7 text-muted">
                Le risposte sono salvate su questo browser quando disponibile.
                Il timer continua anche se cambi pagina o chiudi la scheda. Le
                domande non risposte saranno indicate separatamente nel
                risultato.
              </p>
            </>
          ) : show && last && report ? (
            <>
              <h2
                ref={resultTitle}
                tabIndex={-1}
                className="mt-6 text-2xl font-semibold"
              >
                Risultato: {report.correct.length} su {report.questions.length}
              </h2>
              <p className="mt-3 leading-7">
                {last.reason === "expired"
                  ? "Tempo scaduto: la sessione è stata conclusa automaticamente."
                  : "Sessione conclusa."}
              </p>
              <p className="mt-3 text-sm leading-7">
                Corrette: {report.correct.length} · Errate:{" "}
                {report.wrong.length} · Non risposte: {report.unanswered.length}
              </p>
              <ul
                className="mt-4 space-y-2 text-sm leading-7"
                aria-label="Risultati per argomento"
              >
                {report.topics.map((t) => (
                  <li key={t.id}>
                    {t.title}: {t.correct} corrette su {t.total}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className={action} onClick={() => setShow(false)}>
                  Torna alle impostazioni
                </button>
                {state.wrongIds.length > 0 && (
                  <button className={primary} onClick={() => start(true, true)}>
                    Ripassa errori e non risposte ({state.wrongIds.length})
                  </button>
                )}
              </div>
              <div className="mt-6 space-y-4">
                {report.review.map((q) => (
                  <article
                    key={q.id}
                    className="rounded-xl border border-border bg-white p-5"
                  >
                    <h3 className="font-semibold leading-7">{q.question}</h3>
                    <p className="mt-3 text-sm leading-7">
                      La tua risposta:{" "}
                      {last.answers[q.id] === undefined
                        ? "Non risposta"
                        : q.choices[last.answers[q.id]]}
                    </p>
                    <p className="mt-2 font-medium leading-7">
                      Risposta corretta: {q.choices[q.correctIndex]}
                    </p>
                    <p className="mt-3 leading-7">{q.explanation}</p>
                    <details className="mt-4 text-sm leading-7 text-muted">
                      <summary className="cursor-pointer text-accent">
                        Confronta con la fonte
                      </summary>
                      <blockquote className="mt-3 border-l-2 border-emerald-200 pl-4">
                        {q.quote}
                      </blockquote>
                      {!demo && (
                        <a
                          className="mt-2 inline-flex min-h-12 items-center underline"
                          href={`${bank.sourceUrl}#page=${q.page}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Apri gli appunti · pagina {q.page}
                        </a>
                      )}
                    </details>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 space-y-5">
              <h2 className="text-2xl font-semibold">Prepara l’allenamento</h2>
              {active && (
                <div className="rounded-xl border border-border bg-white p-5">
                  <p className="leading-7">
                    Hai una sessione in corso su {title(active.scope)}. Il
                    timer, se impostato, continua.
                  </p>
                  <button
                    className={`${primary} mt-3`}
                    onClick={() => setShow(true)}
                  >
                    Riprendi la sessione
                  </button>
                </div>
              )}
              <p className="text-sm leading-7 text-muted">
                Selezione: {title(scope)}. {pool.length} domande disponibili per
                questa modalità.
              </p>
              <label
                htmlFor={wrongId}
                className="flex items-start gap-3 text-sm leading-7"
              >
                <input
                  id={wrongId}
                  type="checkbox"
                  className="mt-2 h-4 w-4 shrink-0"
                  checked={onlyWrong}
                  onChange={(e) => setOnlyWrong(e.target.checked)}
                />
                <span>
                  Usa solo errori e non risposte delle sessioni precedenti
                </span>
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    htmlFor={countId}
                  >
                    Domande della sessione
                  </label>
                  <input
                    id={countId}
                    className="min-h-12 w-full rounded-xl border border-border bg-white px-4"
                    type="number"
                    min={1}
                    max={pool.length || 1}
                    value={amount || 1}
                    disabled={Boolean(active) || !pool.length}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    htmlFor={timeId}
                  >
                    Tempo massimo
                  </label>
                  <select
                    id={timeId}
                    className="min-h-12 w-full rounded-xl border border-border bg-white px-4"
                    value={minutes}
                    disabled={Boolean(active)}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  >
                    <option value={0}>Senza limite</option>
                    {[5, 10, 20, 30, 60].map((n) => (
                      <option key={n} value={n}>
                        {n} minuti
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className={primary}
                  disabled={Boolean(active) || !pool.length}
                  onClick={() => start()}
                >
                  Avvia allenamento
                </button>
                {last && (
                  <button
                    className={action}
                    disabled={Boolean(active)}
                    onClick={() => setShow(true)}
                  >
                    Apri ultimo risultato
                  </button>
                )}
              </div>
              {state.history.length > 0 && (
                <details className="border-t border-border pt-4">
                  <summary className="cursor-pointer font-medium">
                    Ultime sessioni su questo browser ({state.history.length})
                  </summary>
                  <ul className="mt-4 space-y-3 text-sm leading-7">
                    {state.history.map((h) => (
                      <li key={h.id}>
                        {new Intl.DateTimeFormat("it-IT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(h.finishedAt))}{" "}
                        · {title(h.scope)} · {h.correct}/{h.total} corrette
                        {h.reason === "expired" ? " · tempo scaduto" : ""}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {(active || last || state.wrongIds.length > 0) && (
                <button
                  className={action}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Eliminare sessione, risultati e lista di ripasso di questa banca da questo browser?",
                      )
                    ) {
                      store.reset();
                      setShow(false);
                    }
                  }}
                >
                  Azzera dati dell’allenamento
                </button>
              )}
            </div>
          )}
          <details className="mt-6 border-t border-border pt-4 text-sm leading-7 text-muted">
            <summary>Come funziona e dove si salva</summary>
            <p className="mt-3">
              Tempo e quantità sono scelti da te e dipendono dalle domande
              disponibili. Un punteggio alto non dimostra la copertura del corso
              o il superamento dell’esame reale.
            </p>
            <p className="mt-3">
              Dati conservati solo su questo browser e per questa versione della
              banca: non vengono inviati al server o sincronizzati fra
              dispositivi. Non è una valutazione certificata.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
