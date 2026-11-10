"use client";
import { useId, useState } from "react";
import type { MapInput, ToolSource } from "@/lib/learning-tools/schema";
const button =
  "min-h-12 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium hover:bg-emerald-50";
export function ConceptMap({
  data,
  source,
}: {
  data: MapInput;
  source?: ToolSource;
}) {
  const [selected, setSelected] = useState(data.nodes[0].id),
    [list, setList] = useState(false),
    [zoom, setZoom] = useState(1);
  const uid = useId().replaceAll(":", ""),
    node = data.nodes.find((n) => n.id === selected) ?? data.nodes[0];
  const points = new Map(
    data.nodes.map((n, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / data.nodes.length;
      return [
        n.id,
        { x: 500 + 320 * Math.cos(angle), y: 420 + 320 * Math.sin(angle) },
      ];
    }),
  );
  const related = data.links.filter(
    (e) => e.from === node.id || e.to === node.id,
  );
  return (
    <section className="mt-6 min-w-0" aria-label={`Mappa: ${data.title}`}>
      <h2 className="text-2xl font-semibold">{data.title}</h2>
      <p className="mt-3 leading-7 text-muted">{data.summary}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className={button}
          aria-pressed={!list}
          onClick={() => setList(false)}
        >
          Grafo
        </button>
        <button
          className={button}
          aria-pressed={list}
          onClick={() => setList(true)}
        >
          Elenco dei concetti
        </button>
        {!list && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor={`${uid}-zoom`}>Zoom</label>
            <select
              id={`${uid}-zoom`}
              className={`${button} max-w-28`}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            >
              <option value={1}>100%</option>
              <option value={1.5}>150%</option>
              <option value={2}>200%</option>
            </select>
          </div>
        )}
      </div>
      {list ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {data.nodes.map((n) => (
            <li key={n.id}>
              <button
                className={`${button} w-full text-left ${n.id === node.id ? "border-emerald-700 bg-emerald-50" : ""}`}
                aria-pressed={n.id === node.id}
                onClick={() => setSelected(n.id)}
              >
                {n.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="mt-5 overflow-x-auto rounded-2xl border border-border bg-white p-2"
          role="region"
          aria-label="Grafo scorrevole; disponibile anche come elenco"
          tabIndex={0}
        >
          <svg
            viewBox="0 0 1000 840"
            style={{ width: `${zoom * 100}%`, minWidth: 580 }}
            aria-label={`Relazioni fra ${data.nodes.length} concetti`}
            role="group"
          >
            <defs>
              <marker
                id={`${uid}-arrow`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {data.links.map((e, i) => {
              const a = points.get(e.from)!,
                b = points.get(e.to)!,
                dx = b.x - a.x,
                dy = b.y - a.y,
                length = Math.hypot(dx, dy);
              const active = e.from === node.id || e.to === node.id;
              return (
                <g
                  key={i}
                  aria-hidden="true"
                  className={active ? "text-emerald-700" : "text-slate-300"}
                >
                  <line
                    x1={a.x + (dx * 80) / length}
                    y1={a.y + (dy * 48) / length}
                    x2={b.x - (dx * 80) / length}
                    y2={b.y - (dy * 48) / length}
                    stroke="currentColor"
                    strokeWidth={active ? 3 : 1.5}
                    markerEnd={`url(#${uid}-arrow)`}
                  />
                </g>
              );
            })}
            {data.nodes.map((n) => {
              const p = points.get(n.id)!;
              return (
                <g key={n.id} transform={`translate(${p.x - 72},${p.y - 36})`}>
                  <foreignObject width="144" height="72">
                    <button
                      onClick={() => setSelected(n.id)}
                      aria-label={n.label}
                      title={n.label}
                      aria-pressed={n.id === node.id}
                      className={`h-full w-full break-words rounded-xl border-2 px-2 text-sm font-semibold leading-5 ${n.id === node.id ? "border-emerald-700 bg-emerald-100 text-ink" : "border-slate-300 bg-white text-ink hover:bg-slate-50"}`}
                    >
                      <span className="line-clamp-3">{n.label}</span>
                    </button>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      )}
      <div
        className="mt-5 rounded-2xl border border-border bg-white p-5"
        aria-live="polite"
      >
        <h3 className="text-lg font-semibold">{node.label}</h3>
        <p className="mt-3 whitespace-pre-wrap leading-8">{node.description}</p>
        <ul className="mt-4 space-y-3 text-sm leading-7">
          {related.map((e, i) => (
            <li key={i}>
              <strong>{data.nodes.find((n) => n.id === e.from)!.label}</strong>
              {" · "}
              {e.label}
              {" · "}
              <strong>{data.nodes.find((n) => n.id === e.to)!.label}</strong>
            </li>
          ))}
        </ul>
        {source && (
          <a
            className="mt-4 inline-flex min-h-12 items-center text-sm font-medium text-accent underline"
            href={`${source.fileUrl}#page=${node.page}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Confronta con gli appunti · pagina {node.page}
          </a>
        )}
      </div>
    </section>
  );
}
