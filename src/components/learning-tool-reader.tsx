"use client";
import { useId, useState } from "react";
import type { PublishedTool } from "@/lib/learning-tools/schema";
import { audioUrl } from "@/lib/learning-tools/schema";
import { ConceptMap } from "./concept-map";
import { PodcastPlayer } from "./podcast-player";
export function LearningToolReader({
  tools,
  kind,
}: {
  tools: PublishedTool[];
  kind: "map" | "podcast";
}) {
  const available = tools.filter((t) => t.input.kind === kind),
    [id, setId] = useState(available[0]?.id ?? ""),
    label = useId();
  const tool = available.find((t) => t.id === id) ?? available[0];
  if (!tool)
    return (
      <p className="empty-panel mt-6">Questo strumento è in preparazione.</p>
    );
  return (
    <div className="mt-6">
      {available.length > 1 && (
        <>
          <label className="block text-sm font-medium" htmlFor={label}>
            {kind === "map" ? "Scegli la mappa" : "Scegli l'episodio"}
          </label>
          <select
            id={label}
            className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3"
            value={tool.id}
            onChange={(e) => setId(e.target.value)}
          >
            {available.map((t) => (
              <option value={t.id} key={t.id}>
                {t.input.title}
              </option>
            ))}
          </select>
        </>
      )}
      {tool.input.kind === "map" ? (
        <ConceptMap key={tool.id} data={tool.input} source={tool.source} />
      ) : (
        <PodcastPlayer
          key={tool.id}
          data={tool.input}
          url={audioUrl(tool.subjectSlug, tool.audio!)}
          source={tool.source}
        />
      )}
      <details className="mt-6 border-t border-border pt-4 text-sm leading-7 text-muted">
        <summary className="cursor-pointer">Provenienza e revisione</summary>
        <p className="mt-3">
          {tool.input.author}. Contenuto{" "}
          {tool.input.origin === "ai-assisted"
            ? "preparato con supporto AI"
            : "originale"}
          . Revisione redazionale del{" "}
          {new Intl.DateTimeFormat("it-IT", {
            dateStyle: "medium",
            timeZone: "Europe/Rome",
          }).format(new Date(tool.reviewedAt))}
          .
        </p>
        <p className="mt-3">
          Fonte: {tool.source.title}. La revisione non esclude possibili errori:
          confronta i contenuti con gli appunti.
        </p>
      </details>
    </div>
  );
}
