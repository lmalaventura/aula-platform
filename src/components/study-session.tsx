"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import type { Evidence, Flashcard, QuizQuestion } from "@/lib/study/schema";

const button = "inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50";

function SourceEvidence({ evidence, fileUrl }: { evidence: Evidence; fileUrl: string }) {
  return (
    <div className="mt-4 text-sm leading-7">
      <a href={`${fileUrl}#page=${evidence.page}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center font-medium text-accent underline underline-offset-4">
        Apri la fonte: pagina {evidence.page} del PDF (nuova scheda)
      </a>
      <details className="mt-2 rounded-xl border border-border p-3">
        <summary className="cursor-pointer font-medium">Passaggio citato dagli appunti</summary>
        <blockquote className="mt-3 whitespace-pre-wrap text-muted">{evidence.quote}</blockquote>
      </details>
    </div>
  );
}

function Flashcards({ cards, fileUrl }: { cards: Flashcard[]; fileUrl: string }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index];
  const answerId = useId();
  function move(next: number) {
    setIndex(next);
    setRevealed(false);
  }
  return (
    <div>
      <p className="text-sm leading-7 text-muted">Prova a rispondere prima di mostrare la soluzione.</p>
      <div className="mt-4 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div aria-live="polite" aria-atomic="true">
          <p className="font-mono text-xs text-muted">Flashcard {index + 1} di {cards.length}</p>
          <h3 className="mt-4 text-xl font-semibold leading-8">{card.front}</h3>
        </div>
        <button type="button" aria-expanded={revealed} aria-controls={answerId} onClick={() => setRevealed(!revealed)} className={`${button} mt-5 bg-emerald-100 text-ink`}>
          {revealed ? "Nascondi risposta" : "Mostra risposta"}
        </button>
        <div id={answerId} hidden={!revealed}>
          <p className="mt-5 whitespace-pre-wrap leading-8">{card.back}</p>
          <SourceEvidence evidence={card} fileUrl={fileUrl} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={button} disabled={index === 0} onClick={() => move(index - 1)}>Precedente</button>
        <button type="button" className={button} disabled={index === cards.length - 1} onClick={() => move(index + 1)}>Successiva</button>
        {index === cards.length - 1 && <button type="button" className={button} onClick={() => move(0)}>Ricomincia le flashcard</button>}
      </div>
    </div>
  );
}

function Quiz({ questions, fileUrl }: { questions: QuizQuestion[]; fileUrl: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [corrected, setCorrected] = useState(false);
  const instanceId = useId();
  const resultRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const remaining = questions.length - Object.keys(answers).length;
  const score = questions.filter((question, index) => question.correctIndex === answers[index]).length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (remaining > 0) return;
    setCorrected(true);
    // Il risultato resta montato: lo spostamento di focus lo rende raggiungibile anche da tastiera.
    resultRef.current?.focus();
  }
  function reset() {
    setAnswers({});
    setCorrected(false);
    titleRef.current?.focus();
  }

  return (
    <div>
      <h3 ref={titleRef} tabIndex={-1} className="text-lg font-semibold">Metti alla prova la comprensione</h3>
      <p className="mt-2 text-sm leading-7 text-muted">Scegli una risposta per ogni domanda. Le spiegazioni compaiono dopo la correzione.</p>
      <p ref={resultRef} tabIndex={-1} role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 font-medium">
        {corrected ? `Risultato: ${score} ${score === 1 ? "risposta corretta" : "risposte corrette"} su ${questions.length}.` : `${remaining} ${remaining === 1 ? "domanda ancora da completare" : "domande ancora da completare"}.`}
      </p>
      <form onSubmit={submit} className="mt-5 space-y-5">
        {questions.map((question, index) => (
          <div key={index} className="rounded-2xl border border-border bg-white p-5 sm:p-7">
            <fieldset disabled={corrected}>
              <legend className="mb-4 text-base font-semibold leading-8">{index + 1}. {question.question}</legend>
              <div className="space-y-2">
                {question.choices.map((choice, choiceIndex) => (
                  <label key={choiceIndex} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm leading-7">
                    <input type="radio" name={`${instanceId}-${index}`} value={choiceIndex} checked={answers[index] === choiceIndex} onChange={() => setAnswers((previous) => ({ ...previous, [index]: choiceIndex }))} className="mt-1.5 h-4 w-4 shrink-0 accent-accent" />
                    <span className="min-w-0">{choice}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {corrected && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-semibold">{answers[index] === question.correctIndex ? "Risposta corretta." : "Risposta non corretta."}</p>
                <p className="mt-2 leading-7"><span className="font-medium">Soluzione: </span>{question.choices[question.correctIndex]}</p>
                <p className="mt-3 whitespace-pre-wrap leading-8 text-muted">{question.explanation}</p>
                <SourceEvidence evidence={question} fileUrl={fileUrl} />
              </div>
            )}
          </div>
        ))}
        {corrected ? (
          <button type="button" className={button} onClick={reset}>Riprova il quiz</button>
        ) : (
          <button type="submit" disabled={remaining > 0} className={`${button} bg-emerald-100 text-ink`}>Correggi le risposte</button>
        )}
      </form>
    </div>
  );
}

export function StudySession({ flashcards, quiz, fileUrl }: { flashcards: Flashcard[]; quiz: QuizQuestion[]; fileUrl: string }) {
  const [mode, setMode] = useState<"flashcards" | "quiz">("flashcards");
  return (
    <div className="mt-6 min-w-0 [overflow-wrap:anywhere]">
      <noscript><p className="mb-4 rounded-xl border border-border p-4">Attiva JavaScript per utilizzare quiz e flashcard interattivi. Il documento originale resta consultabile dal collegamento alla fonte.</p></noscript>
      <div role="group" aria-label="Modalità di studio" className="mb-6 flex flex-wrap gap-3">
        <button type="button" aria-pressed={mode === "flashcards"} className={`${button} ${mode === "flashcards" ? "bg-ink text-white hover:bg-ink" : "bg-white"}`} onClick={() => setMode("flashcards")}>Flashcard ({flashcards.length})</button>
        <button type="button" aria-pressed={mode === "quiz"} className={`${button} ${mode === "quiz" ? "bg-ink text-white hover:bg-ink" : "bg-white"}`} onClick={() => setMode("quiz")}>Quiz ({quiz.length})</button>
      </div>
      {mode === "flashcards" ? <Flashcards cards={flashcards} fileUrl={fileUrl} /> : <Quiz questions={quiz} fileUrl={fileUrl} />}
    </div>
  );
}
