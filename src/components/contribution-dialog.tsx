"use client";
import { useId, useRef, useState } from "react";
import { ContributorPanel, type SubjectOption } from "./contributor-panel";
export function ContributionDialog({
  config,
  subjects,
}: {
  config: { url: string; key: string } | null;
  subjects: SubjectOption[];
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    title = useId();
  const [opened, setOpened] = useState(false),
    [busy, setBusy] = useState(false);
  function open() {
    setOpened(true);
    dialog.current?.showModal();
  }
  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-accent"
        onClick={open}
      >
        <span aria-hidden="true">＋</span> Proponi materiale
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={title}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-border bg-white p-5 text-ink backdrop:bg-black/40 sm:p-8"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
        onClose={() => setOpened(false)}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id={title} className="text-2xl font-semibold">
            Proponi un contributo
          </h2>
          <button
            type="button"
            aria-label="Chiudi contributo"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        {opened &&
          (config ? (
            <ContributorPanel
              config={config}
              subjects={subjects}
              onBusyChange={setBusy}
            />
          ) : (
            <p className="leading-8">
              L’invio dei contributi non è ancora configurato. Puoi consultare
              liberamente i materiali e gli strumenti pubblicati.
            </p>
          ))}
      </dialog>
    </>
  );
}
