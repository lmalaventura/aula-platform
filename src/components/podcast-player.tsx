"use client";
import { useId, useRef, useState } from "react";
import type { PodcastInput, ToolSource } from "@/lib/learning-tools/schema";
export function PodcastPlayer({
  data,
  url,
  source,
}: {
  data: PodcastInput;
  url: string;
  source?: ToolSource;
}) {
  const audio = useRef<HTMLAudioElement>(null),
    pending = useRef<number | null>(null);
  const speedId = useId();
  const [rate, setRate] = useState(1),
    [current, setCurrent] = useState(0),
    [error, setError] = useState("");
  const active = data.chapters.reduce(
    (best, c, i) => (c.start <= current ? i : best),
    0,
  );
  function seek(start: number) {
    const element = audio.current;
    if (!element) return;
    setError("");
    if (!element.readyState) {
      pending.current = start;
      element.load();
      return;
    }
    if (!Number.isFinite(element.duration) || start >= element.duration) {
      setError(
        "Questo capitolo è oltre la durata dell'audio: segnala la trascrizione alla redazione.",
      );
      return;
    }
    element.currentTime = start;
    setCurrent(start);
  }
  return (
    <section className="mt-6 min-w-0" aria-label={`Podcast: ${data.title}`}>
      <h2 className="text-2xl font-semibold">{data.title}</h2>
      <p className="mt-3 leading-7 text-muted">{data.summary}</p>
      <audio
        ref={audio}
        controls
        preload="metadata"
        src={url}
        className="mt-5 w-full"
        aria-label={data.title}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = rate;
          if (pending.current !== null) {
            const start = pending.current;
            pending.current = null;
            seek(start);
          }
        }}
        onError={() =>
          setError(
            "Audio non riproducibile. Puoi leggere la trascrizione; segnala il file alla redazione.",
          )
        }
      >
        Il browser non supporta l’audio incorporato.
      </audio>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium">
        <label htmlFor={speedId}>Velocità di ascolto</label>
        <select
          id={speedId}
          className="min-h-12 rounded-xl border border-border bg-white px-4"
          value={rate}
          onChange={(e) => {
            const next = Number(e.target.value);
            setRate(next);
            if (audio.current) audio.current.playbackRate = next;
          }}
        >
          {[0.75, 1, 1.25, 1.5, 2].map((n) => (
            <option key={n} value={n}>
              {n}×
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-4 text-sm leading-7 text-red-800" role="alert">
          {error}
        </p>
      )}
      <p className="mt-4 text-sm leading-7 text-muted">
        Audio{" "}
        {data.audioOrigin === "synthesized" ? "sintetizzato" : "registrato"}.
        Trascrizione disponibile per tutti i capitoli.
      </p>
      <div className="mt-6 space-y-3">
        {data.chapters.map((chapter, i) => (
          <details
            key={i}
            className="rounded-xl border border-border bg-white p-4"
          >
            <summary className="cursor-pointer font-medium leading-7">
              {Math.floor(chapter.start / 60)}:
              {String(Math.floor(chapter.start % 60)).padStart(2, "0")} ·{" "}
              {chapter.title}
              {active === i && (
                <span className="ml-2 text-xs text-accent">
                  Posizione attuale
                </span>
              )}
            </summary>
            <button
              className="mt-3 min-h-12 rounded-xl border border-border px-4 text-sm font-medium hover:bg-emerald-50"
              onClick={() => seek(chapter.start)}
            >
              Vai al capitolo {i + 1}
            </button>
            <p className="mt-4 whitespace-pre-wrap leading-8">{chapter.text}</p>
            {source && (
              <a
                className="mt-3 inline-flex min-h-12 items-center text-sm font-medium text-accent underline"
                href={`${source.fileUrl}#page=${chapter.page}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Fonte del capitolo · pagina {chapter.page}
              </a>
            )}
          </details>
        ))}
      </div>
      <a
        className="mt-5 inline-flex min-h-12 items-center text-sm text-accent underline"
        href={url}
        download
      >
        Scarica l&apos;audio
      </a>
    </section>
  );
}
