"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { StudyBank } from "@/lib/study/bank";
import type { PublishedTool } from "@/lib/learning-tools/schema";
import { studyChoices, type StudyMode } from "@/lib/study/modes";
import { LearnerStudy } from "./learner-study";
import { LearningToolReader } from "./learning-tool-reader";
import { AnimatedMascot } from "./animated-mascot";
import { StudyObject } from "./study-object";
import { UiIcon } from "./ui-icon";
export function StudyModes({
  bank,
  tools,
  demo = false,
  autoFocus = false,
}: {
  bank: StudyBank | null;
  tools: PublishedTool[];
  demo?: boolean;
  autoFocus?: boolean;
}) {
  const [mode, setMode] = useState<StudyMode | null>(null);
  const choices = studyChoices(bank, tools),
    choice = choices.find((item) => item.id === mode);
  const heading = useRef<HTMLHeadingElement>(null),
    interacted = useRef(false);
  useEffect(() => {
    if (interacted.current || autoFocus) heading.current?.focus();
  }, [mode, autoFocus]);
  function choose(next: StudyMode | null) {
    interacted.current = true;
    setMode(next);
  }
  return (
    <div className="study-hub mt-8">
      {demo && (
        <p className="coverage-note">
          Demo tecnica: domande sull’interfaccia, non contenuti di una materia.
        </p>
      )}
      {!choice ? (
        <>
          <div className="study-selector">
            <div className="selector-host">
              <AnimatedMascot pose="menu" arriving />
              <span className="scene-caption" aria-hidden="true">
                C’è tutto nello zaino.
              </span>
            </div>
            <div className="selector-worktop">
              <div className="speech-bubble">
                <h2 ref={heading} tabIndex={-1}>
                  Come ti va di studiare?
                </h2>
                <p>Scegli uno strumento. Io ti accompagno.</p>
              </div>
              <div
                className="tool-shelf"
                role="group"
                aria-label="Strumenti di studio"
              >
                {choices.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="tool-tile"
                    style={{ "--tool-order": index } as CSSProperties}
                    onClick={() => choose(item.id)}
                  >
                    <StudyObject mode={item.id} />
                    <span className="tool-tile-title">
                      {item.title}
                      <UiIcon name="arrow" />
                    </span>
                    <span className="tool-tile-description">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {!choices.length && (
            <p className="empty-panel">Gli strumenti sono in preparazione.</p>
          )}
        </>
      ) : (
        <>
          <button
            className="breadcrumb-link"
            type="button"
            onClick={() => choose(null)}
          >
            ← Tutti gli strumenti
          </button>
          <div className="study-room" key={choice.id} data-mode={choice.id}>
            <aside
              className="activity-companion"
              aria-label="Compagno di studio"
            >
              <AnimatedMascot pose={choice.id} arriving />
              <p className="scene-caption">
                {choice.id === "podcast"
                  ? "Mi metto in ascolto."
                  : choice.id === "map"
                    ? "Colleghiamo le idee."
                    : choice.id === "cards"
                      ? "Una carta alla volta."
                      : "Pronto? Si comincia."}
              </p>
            </aside>
            <div className="activity-workspace">
              <header className="activity-heading">
                <p className="eyebrow">Un argomento alla volta</p>
                <h2 ref={heading} tabIndex={-1}>
                  {choice.title}
                </h2>
                <p>{choice.description}</p>
              </header>
              {(choice.id === "quiz" ||
                choice.id === "cards" ||
                choice.id === "exam") &&
                bank && (
                  <>
                    <LearnerStudy
                      key={choice.id}
                      bank={bank}
                      mode={choice.id}
                      demo={demo}
                    />
                    {!demo && (
                      <details className="mt-6 border-t border-border pt-4 text-sm leading-7 text-muted">
                        <summary>Fonti e aggiornamento</summary>
                        <p className="mt-3">
                          Fonte: {bank.sourceTitle}. Revisione del{" "}
                          {new Intl.DateTimeFormat("it-IT", {
                            dateStyle: "medium",
                            timeZone: "Europe/Rome",
                          }).format(new Date(bank.reviewedAt))}
                          . Attività preparate con AI e revisionate; possono
                          contenere errori.
                        </p>
                        {bank.coveredUnits < bank.availableUnits && (
                          <p className="mt-3">
                            Copertura parziale degli appunti attuali; non
                            rappresenta l’intero programma d’esame.
                          </p>
                        )}
                        <p className="mt-3">Built with Llama.</p>
                        <Link
                          className="inline-flex min-h-12 items-center underline"
                          href={"/risorse/" + bank.sourceId}
                        >
                          Leggi gli appunti condivisi
                        </Link>
                      </details>
                    )}
                  </>
                )}
              {(choice.id === "map" || choice.id === "podcast") && (
                <LearningToolReader
                  key={choice.id}
                  tools={tools}
                  kind={choice.id}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
