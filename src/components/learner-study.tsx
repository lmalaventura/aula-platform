"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ExamPractice } from "./exam-practice";
import {
  selectBank,
  type StudyBank,
  type BankCard,
  type BankQuestion,
} from "@/lib/study/bank";

const action = "button-secondary";
const primary = "button-primary";
function shuffle<T>(values: T[]): T[] {
  const list = [...values];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
function Source({ item, url }: { item: BankCard | BankQuestion; url: string }) {
  return (
    <details className="mt-4 text-sm leading-7 text-muted">
      <summary className="cursor-pointer font-medium text-accent">
        Confronta con la fonte
      </summary>
      <blockquote className="mt-3 border-l-2 border-emerald-200 pl-4">
        {item.quote}
      </blockquote>
      {url && (
        <a
          className="mt-2 inline-flex min-h-12 items-center underline"
          href={`${url}#page=${item.page}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apri gli appunti · pagina {item.page}
        </a>
      )}
    </details>
  );
}
function Cards({ cards, url }: { cards: BankCard[]; url: string }) {
  const [position, setPosition] = useState(0),
    [revealed, setRevealed] = useState(false);
  const card = cards[position];
  function move(delta: number) {
    setPosition((n) => n + delta);
    setRevealed(false);
  }
  return (
    <section className="mt-6" aria-label="Ripasso con flashcard">
      <p className="text-sm text-muted" role="status">
        Flashcard {position + 1} di {cards.length}
      </p>
      <div className="mt-4 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold leading-8">{card.front}</h2>
        {revealed ? (
          <>
            <p className="mt-5 whitespace-pre-wrap leading-8">{card.back}</p>
            <Source item={card} url={url} />
          </>
        ) : (
          <button
            className={`${action} mt-6 bg-emerald-100`}
            onClick={() => setRevealed(true)}
          >
            Mostra risposta
          </button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className={action}
          disabled={position === 0}
          onClick={() => move(-1)}
        >
          Precedente
        </button>
        <button
          className={action}
          disabled={position === cards.length - 1}
          onClick={() => move(1)}
        >
          Successiva
        </button>
      </div>
    </section>
  );
}
function Quiz({
  questions,
  bank,
  onPractice,
  demo = false,
}: {
  questions: BankQuestion[];
  bank: StudyBank;
  onPractice: (topic: string) => void;
  demo?: boolean;
}) {
  const [position, setPosition] = useState(0),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [finished, setFinished] = useState(false);
  const group = useId(),
    question = questions[position];
  const fieldset = useRef<HTMLFieldSetElement>(null),
    result = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (finished) result.current?.focus();
    else fieldset.current?.focus();
  }, [finished, position]);
  if (finished) {
    const wrong = questions.filter((q) => answers[q.id] !== q.correctIndex);
    const weak = bank.topics.filter((t) =>
      wrong.some((q) => q.topicId === t.id),
    );
    return (
      <section className="mt-6" aria-label="Risultato del quiz">
        <h2 ref={result} className="text-2xl font-semibold" tabIndex={-1}>
          Risultato: {questions.length - wrong.length} su {questions.length}
        </h2>
        <p className="mt-3 leading-7 text-muted">
          {wrong.length
            ? "Puoi ripartire dagli argomenti delle risposte da rivedere."
            : "Hai risposto correttamente a tutte le domande di questa sessione."}
        </p>
        {weak.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {weak.map((t) => (
              <button
                className={action}
                key={t.id}
                onClick={() => onPractice(t.id)}
              >
                Ripassa {t.title}
              </button>
            ))}
          </div>
        )}
        <div className="mt-6 space-y-4">
          {wrong.map((q) => (
            <article
              key={q.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <h3 className="font-semibold leading-7">{q.question}</h3>
              <p className="mt-3 text-sm leading-7">
                La tua risposta: {q.choices[answers[q.id]]}
              </p>
              <p className="mt-2 text-sm font-medium leading-7">
                Risposta corretta: {q.choices[q.correctIndex]}
              </p>
              <p className="mt-3 leading-7 text-muted">{q.explanation}</p>
              <Source item={q} url={demo ? "" : bank.sourceUrl} />
            </article>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="mt-6" aria-label="Quiz di autovalutazione">
      <p className="text-sm text-muted" role="status">
        Domanda {position + 1} di {questions.length}
      </p>
      <progress
        className="mt-3 h-2 w-full accent-accent"
        value={Object.keys(answers).length}
        max={questions.length}
        aria-label="Domande risposte"
      />
      <fieldset
        ref={fieldset}
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
              className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-base leading-7"
            >
              <input
                className="mt-1.5 h-4 w-4 shrink-0 accent-accent"
                type="radio"
                name={group}
                value={i}
                checked={answers[question.id] === i}
                onChange={() => setAnswers({ ...answers, [question.id]: i })}
              />
              <span>{choice}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className={action}
          disabled={position === 0}
          onClick={() => setPosition((n) => n - 1)}
        >
          Precedente
        </button>
        {position === questions.length - 1 ? (
          <button
            className={primary}
            disabled={Object.keys(answers).length !== questions.length}
            onClick={() => setFinished(true)}
          >
            Correggi il quiz
          </button>
        ) : (
          <button
            className={primary}
            disabled={answers[question.id] === undefined}
            onClick={() => setPosition((n) => n + 1)}
          >
            Successiva
          </button>
        )}
      </div>
    </section>
  );
}
export function LearnerStudy({
  bank,
  mode,
  demo = false,
}: {
  bank: StudyBank;
  mode?: "cards" | "quiz" | "exam";
  demo?: boolean;
}) {
  const [topicId, setTopicId] = useState(""),
    [session, setSession] = useState<{
      mode: "cards" | "quiz" | "exam";
      cards: BankCard[];
      questions: BankQuestion[];
      id: number;
    } | null>(null);
  const scopeId = useId(),
    selected = selectBank(bank, topicId);
  function chooseTopic(topic: string) {
    setTopicId(topic);
    setSession(null);
  }
  function start(next: "cards" | "quiz" | "exam") {
    setSession({
      mode: next,
      cards: shuffle(selected.flashcards),
      questions: shuffle(selected.quiz),
      id: Date.now(),
    });
  }
  return (
    <div className="mt-6 min-w-0 [overflow-wrap:anywhere]">
      <label htmlFor={scopeId} className="block text-sm font-medium">
        Cosa vuoi ripassare?
      </label>
      <select
        id={scopeId}
        className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-base"
        value={topicId}
        onChange={(event) => chooseTopic(event.target.value)}
      >
        <option value="">Tutti gli argomenti disponibili</option>
        {bank.topics.map((topic) => (
          <option value={topic.id} key={topic.id}>
            {topic.title}
          </option>
        ))}
      </select>
      {mode !== "exam" && (
        <p className="mt-3 text-sm leading-7 text-muted">
          {mode === "cards" ? (
            <>{selected.flashcards.length} flashcard</>
          ) : mode === "quiz" ? (
            <>
              {selected.quiz.length}{" "}
              {selected.quiz.length === 1 ? "domanda" : "domande"}
            </>
          ) : (
            <>
              {selected.quiz.length} domande · {selected.flashcards.length}{" "}
              flashcard
            </>
          )}{" "}
          nella selezione.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {(!mode || mode === "quiz") && (
          <button
            className={primary}
            disabled={!selected.quiz.length}
            onClick={() => start("quiz")}
          >
            {session?.mode === "quiz" ? "Ricomincia il quiz" : "Inizia quiz"}
          </button>
        )}
        {(!mode || mode === "cards") && (
          <button
            className={mode === "cards" ? primary : action}
            disabled={!selected.flashcards.length}
            onClick={() => start("cards")}
          >
            {session?.mode === "cards"
              ? "Ricomincia il ripasso"
              : "Ripassa con le flashcard"}
          </button>
        )}
        {!mode && (
          <button
            className={action}
            disabled={!selected.quiz.length}
            onClick={() => start("exam")}
          >
            Allenamento in modalità esame
          </button>
        )}
      </div>
      {session?.mode === "quiz" && (
        <Quiz
          key={session.id}
          questions={session.questions}
          bank={bank}
          onPractice={chooseTopic}
          demo={demo}
        />
      )}
      {session?.mode === "cards" && (
        <Cards
          key={session.id}
          cards={session.cards}
          url={demo ? "" : bank.sourceUrl}
        />
      )}
      {(mode === "exam" || session?.mode === "exam") && (
        <ExamPractice bank={bank} scope={topicId} demo={demo} />
      )}
    </div>
  );
}
