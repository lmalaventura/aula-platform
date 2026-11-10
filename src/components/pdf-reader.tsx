"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask, TextLayer } from "pdfjs-dist";
import {
  pageFromHash,
  pdfPage,
  renderDensity,
  safePdfLink,
} from "@/lib/reader/pdf";
import { UiIcon } from "./ui-icon";

type PdfApi = typeof import("pdfjs-dist");
type Outline = Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>;
type Destination = string | unknown[];

export function PdfReader({ url, title }: { url: string; title: string }) {
  const root = useRef<HTMLDivElement>(null),
    well = useRef<HTMLDivElement>(null),
    paper = useRef<HTMLDivElement>(null);
  const fullButton = useRef<HTMLButtonElement>(null),
    pageInput = useRef<HTMLInputElement>(null);
  const nativeFull = useRef(false),
    api = useRef<PdfApi | null>(null);
  const [documentPdf, setDocumentPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1),
    [zoom, setZoom] = useState("fit"),
    [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0),
    [expanded, setExpanded] = useState(false);
  const [outline, setOutline] = useState<Outline | null>(null),
    [showOutline, setShowOutline] = useState(false);
  const [textWarning, setTextWarning] = useState(false);
  const pageLabel = useId(),
    zoomLabel = useId();

  useEffect(() => {
    let disposed = false;
    let task: ReturnType<PdfApi["getDocument"]> | undefined;
    async function load() {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (disposed) return;
        api.current = pdfjs;
        const assets = "/vendor/pdfjs/" + pdfjs.version + "/";
        pdfjs.GlobalWorkerOptions.workerSrc = assets + "pdf.worker.min.mjs";
        task = pdfjs.getDocument({
          url,
          cMapUrl: assets + "cmaps/",
          cMapPacked: true,
          standardFontDataUrl: assets + "standard_fonts/",
          wasmUrl: assets + "wasm/",
          enableXfa: false,
        });
        const pdf = await task.promise;
        if (disposed) return;
        setPage(pageFromHash(window.location.hash, pdf.numPages));
        setDocumentPdf(pdf);
        const index = await pdf.getOutline().catch(() => null);
        if (!disposed) setOutline(index);
      } catch {
        if (!disposed) {
          setError(
            "Non riesco ad aprire questo PDF. Puoi riprovare o scaricarlo.",
          );
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      disposed = true;
      void task?.destroy();
    };
  }, [url, attempt]);

  useEffect(() => {
    if (!well.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(well.current);
    return () => observer.disconnect();
  }, []);

  function goTo(next: number) {
    if (!documentPdf) return;
    const target = pdfPage(next, documentPdf.numPages);
    if (target === page) return;
    setLoading(true);
    setError("");
    setPage(target);
    window.history.replaceState(window.history.state, "", "#page=" + target);
    well.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
  async function destination(dest: Destination | null) {
    if (!documentPdf || !dest) return;
    try {
      const resolved =
        typeof dest === "string"
          ? await documentPdf.getDestination(dest)
          : dest;
      if (!resolved?.length) return;
      const first = resolved[0];
      const index =
        typeof first === "number"
          ? first
          : first &&
              typeof first === "object" &&
              "num" in first &&
              "gen" in first
            ? await documentPdf.getPageIndex(
                first as { num: number; gen: number },
              )
            : null;
      if (index !== null) goTo(index + 1);
    } catch {
      /* Un rimando non valido non interrompe la lettura. */
    }
  }

  useEffect(() => {
    if (!documentPdf || !api.current || !paper.current || width < 1) return;
    const pdfjs = api.current,
      host = paper.current;
    let cancelled = false,
      render: RenderTask | undefined,
      text: TextLayer | undefined;
    async function paint() {
      try {
        const pdfPageProxy = await documentPdf!.getPage(page);
        if (cancelled) return;
        const original = pdfPageProxy.getViewport({ scale: 1 });
        const scale =
          zoom === "fit"
            ? Math.min(Math.max(180, width) / original.width, 2)
            : Number(zoom);
        const viewport = pdfPageProxy.getViewport({ scale });
        const density = renderDensity(
          viewport.width,
          viewport.height,
          window.devicePixelRatio,
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width * density);
        canvas.height = Math.floor(viewport.height * density);
        canvas.style.width = viewport.width + "px";
        canvas.style.height = viewport.height + "px";
        canvas.setAttribute("aria-hidden", "true");
        const layer = document.createElement("div");
        layer.className = "textLayer";
        host.style.width = viewport.width + "px";
        host.style.height = viewport.height + "px";
        host.style.setProperty(
          "--total-scale-factor",
          String(viewport.scale * viewport.userUnit),
        );
        host.style.setProperty("--scale-round-x", "1px");
        host.style.setProperty("--scale-round-y", "1px");
        host.replaceChildren(canvas, layer);
        render = pdfPageProxy.render({
          canvas,
          viewport,
          transform: [density, 0, 0, density, 0, 0],
        });
        await render.promise;
        if (cancelled) return;
        setLoading(false);
        setError("");
        try {
          const content = await pdfPageProxy.getTextContent();
          if (cancelled) return;
          text = new pdfjs.TextLayer({
            textContentSource: content,
            container: layer,
            viewport,
          });
          await text.render();
          if (!cancelled) setTextWarning(!content.items.length);
        } catch {
          if (!cancelled) setTextWarning(true);
        }
        const annotations = await pdfPageProxy
          .getAnnotations({ intent: "display" })
          .catch(() => []);
        if (cancelled) return;
        const links = document.createElement("div");
        links.className = "pdf-links";
        for (const item of annotations) {
          if (item.subtype !== "Link" || !Array.isArray(item.rect)) continue;
          const href = safePdfLink(item.url),
            dest = item.dest as Destination | undefined;
          if (!href && !dest) continue;
          const [x1, y1] = viewport.convertToViewportPoint(
            item.rect[0],
            item.rect[1],
          );
          const [x2, y2] = viewport.convertToViewportPoint(
            item.rect[2],
            item.rect[3],
          );
          const link = document.createElement("a");
          Object.assign(link.style, {
            left: Math.min(x1, x2) + "px",
            top: Math.min(y1, y2) + "px",
            width: Math.abs(x2 - x1) + "px",
            height: Math.abs(y2 - y1) + "px",
          });
          if (href) {
            link.href = href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.setAttribute("aria-label", "Apri collegamento: " + href);
          } else {
            link.href = "#";
            link.setAttribute("aria-label", "Vai al rimando nel documento");
            link.addEventListener("click", (e) => {
              e.preventDefault();
              void destination(dest!);
            });
          }
          links.append(link);
        }
        host.append(links);
      } catch {
        if (!cancelled) {
          setError(
            "Questa pagina non è stata caricata. Riprova oppure scarica il PDF.",
          );
          setLoading(false);
        }
      }
    }
    void paint();
    return () => {
      cancelled = true;
      render?.cancel();
      text?.cancel();
    };
    // destination is used only by native links owned and removed by this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentPdf, page, zoom, width]);

  useEffect(() => {
    function hashChanged() {
      if (documentPdf) {
        setPage(pageFromHash(window.location.hash, documentPdf.numPages));
      }
    }
    window.addEventListener("hashchange", hashChanged);
    return () => window.removeEventListener("hashchange", hashChanged);
  }, [documentPdf]);

  useEffect(() => {
    function changed() {
      if (!document.fullscreenElement && nativeFull.current) {
        nativeFull.current = false;
        setExpanded(false);
        fullButton.current?.focus();
      }
    }
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setExpanded(false);
        fullButton.current?.focus();
      }
      if (e.key === "Tab" && root.current) {
        const list = Array.from(
          root.current.querySelectorAll<HTMLElement>(
            "button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled)",
          ),
        ).filter((el) => el.getClientRects().length);
        const first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", keys);
    };
  }, [expanded]);
  async function toggleFull() {
    if (expanded) {
      setExpanded(false);
      if (document.fullscreenElement === root.current)
        await document.exitFullscreen().catch(() => {});
      return;
    }
    setExpanded(true);
    if (root.current?.requestFullscreen) {
      try {
        await root.current.requestFullscreen();
        nativeFull.current = true;
      } catch {
        /* Cornice estesa nella stessa pagina se l'API non è disponibile. */
      }
    }
  }
  function outlineItems(items: NonNullable<Outline>, depth = 0) {
    if (depth > 7) return null;
    return (
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item.dest ? (
              <button type="button" onClick={() => void destination(item.dest)}>
                {item.title}
              </button>
            ) : safePdfLink(item.url) ? (
              <a
                href={safePdfLink(item.url)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.title}
              </a>
            ) : (
              <span>{item.title}</span>
            )}
            {item.items?.length ? outlineItems(item.items, depth + 1) : null}
          </li>
        ))}
      </ul>
    );
  }
  const total = documentPdf?.numPages ?? 0;
  return (
    <section
      className={"pdf-reader" + (expanded ? " reader-is-expanded" : "")}
      ref={root}
      aria-label={"Lettore: " + title}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
    >
      <div className="pdf-toolbar">
        <div className="pdf-page-controls">
          <button
            type="button"
            aria-label="Pagina precedente"
            disabled={!total || page <= 1}
            onClick={() => goTo(page - 1)}
          >
            ←
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goTo(Number(pageInput.current?.value));
            }}
          >
            <label htmlFor={pageLabel}>Pagina</label>
            <input
              key={page}
              ref={pageInput}
              id={pageLabel}
              type="number"
              min="1"
              max={total || 1}
              defaultValue={page}
              disabled={!total}
            />
            <span>di {total || "…"}</span>
            <button type="submit" disabled={!total}>
              Vai
            </button>
          </form>
          <button
            type="button"
            aria-label="Pagina successiva"
            disabled={!total || page >= total}
            onClick={() => goTo(page + 1)}
          >
            →
          </button>
        </div>
        <div className="pdf-view-controls">
          {outline?.length ? (
            <button
              type="button"
              aria-expanded={showOutline}
              onClick={() => setShowOutline((v) => !v)}
            >
              Indice
            </button>
          ) : null}
          <label className="sr-only" htmlFor={zoomLabel}>
            Zoom del documento
          </label>
          <select
            id={zoomLabel}
            value={zoom}
            disabled={!total}
            onChange={(e) => {
              setLoading(true);
              setZoom(e.target.value);
            }}
          >
            <option value="fit">Adatta alla larghezza</option>
            <option value="1">100%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
          </select>
          <button
            type="button"
            ref={fullButton}
            onClick={() => void toggleFull()}
            aria-pressed={expanded}
          >
            {expanded ? "Esci da schermo intero" : "Schermo intero"}
          </button>
          <a href={url} download aria-label="Scarica il documento PDF">
            <UiIcon name="download" />
            <span className="sr-only">Scarica PDF</span>
          </a>
        </div>
      </div>
      <div className="pdf-reading-area">
        {showOutline && outline?.length ? (
          <nav className="pdf-outline" aria-label="Indice del documento">
            {outlineItems(outline)}
          </nav>
        ) : null}
        <div
          ref={well}
          className="pdf-well"
          tabIndex={0}
          aria-label="Pagina del documento, scorribile"
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "PageDown") {
              e.preventDefault();
              goTo(page + 1);
            }
            if (e.key === "PageUp") {
              e.preventDefault();
              goTo(page - 1);
            }
          }}
        >
          <div
            ref={paper}
            className="pdf-paper"
            role="document"
            aria-label={"Pagina " + page + " di " + total}
            aria-busy={loading}
          />
        </div>
      </div>
      <div className="pdf-status" role="status">
        {error ? (
          <>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                setError("");
                setLoading(true);
                setDocumentPdf(null);
                setAttempt((v) => v + 1);
              }}
            >
              Riprova
            </button>
            <a href={url} download>
              Scarica PDF
            </a>
          </>
        ) : loading ? (
          "Sto preparando la pagina…"
        ) : (
          <span>
            Pagina {page} di {total}
            {textWarning
              ? " · Testo selezionabile non disponibile per questa pagina."
              : " · Testo selezionabile"}
          </span>
        )}
      </div>
      <noscript>
        <p>
          Per il lettore serve JavaScript.{" "}
          <a href={url} download>
            Scarica il PDF
          </a>
          .
        </p>
      </noscript>
    </section>
  );
}
