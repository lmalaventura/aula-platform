"use client";
import { useState } from "react";
import { practiceDemoBank } from "@/lib/study/practice-demo";
import { ExamPractice } from "./exam-practice";
import { StudyModes } from "./study-modes";
import { StudyEntrance } from "./study-entrance";
export function PracticeDemo() {
  const [open, setOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  return (
    <section
      className="mt-12 border-t border-border pt-8"
      aria-labelledby="practice-demo-title"
    >
      <h2 id="practice-demo-title" className="text-2xl font-semibold">
        Allenamento: demo tecnica
      </h2>
      <p className="mt-3 leading-7 text-muted">
        Prova timer, ripresa e correzione senza generare contenuti. Le otto
        domande riguardano l’interfaccia e non sono pubblicate come prova di una
        materia.
      </p>
      <button
        className="mt-4 min-h-12 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold hover:bg-emerald-50"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open
          ? "Chiudi la demo di allenamento"
          : "Prova l’allenamento dimostrativo"}
      </button>
      {open && <ExamPractice bank={practiceDemoBank} demo />}
      <details className="mt-6 border-t border-border pt-4">
        <summary className="font-medium">
          Prova anche la scelta strumenti con la mascotte
        </summary>
        {hubOpen ? (
          <>
            <button
              type="button"
              className="breadcrumb-link mt-5"
              onClick={() => setHubOpen(false)}
            >
              ← Torna all’ingresso della demo
            </button>
            <StudyModes bank={practiceDemoBank} tools={[]} demo autoFocus />
          </>
        ) : (
          <StudyEntrance onOpen={() => setHubOpen(true)} />
        )}
      </details>
    </section>
  );
}
