"use client";
import {
  cloneElement,
  useEffect,
  useId,
  useState,
  type ReactElement,
} from "react";
import {
  AUDIO_LIMIT,
  validateToolInput,
  type DraftView,
  type MapInput,
  type PodcastInput,
  type ToolInput,
  type ToolSource,
} from "@/lib/learning-tools/schema";
import { ConceptMap } from "./concept-map";
import { PodcastPlayer } from "./podcast-player";
type Subject = { slug: string; title: string; source: ToolSource };
const control =
  "min-h-12 w-full rounded-xl border border-border bg-white px-3 py-2 text-base";
const button =
  "min-h-12 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50";
function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}
const common = { title: "", summary: "", author: "", origin: "human" as const };
function blank(kind: "map" | "podcast"): ToolInput {
  return kind === "map"
    ? {
        ...common,
        kind,
        nodes: [1, 2].map((i) => ({
          id: `n-${i}`,
          label: "",
          description: "",
          page: 1,
        })),
        links: [{ from: "n-1", to: "n-2", label: "" }],
      }
    : {
        ...common,
        kind,
        audioOrigin: "recorded",
        chapters: [{ title: "", start: 0, text: "", page: 1 }],
      };
}
const demoMap: MapInput = {
  kind: "map",
  title: "Demo tecnica della mappa",
  summary:
    "Dati dimostrativi: questa mappa spiega il lettore e non deriva dagli appunti della materia.",
  author: "Aula · demo",
  origin: "demo",
  nodes: [
    {
      id: "concetto",
      label: "Concetto",
      description:
        "Seleziona un concetto con il mouse o la tastiera per leggere la spiegazione.",
      page: 1,
    },
    {
      id: "relazione",
      label: "Relazione",
      description:
        "Le frecce e il testo descrivono il collegamento fra due concetti.",
      page: 1,
    },
    {
      id: "fonte",
      label: "Fonte",
      description:
        "Nelle mappe reali ogni concetto rimanda a una pagina del documento controllato dalla redazione.",
      page: 1,
    },
  ],
  links: [
    { from: "concetto", to: "relazione", label: "si collega attraverso una" },
    { from: "relazione", to: "fonte", label: "si controlla nella" },
  ],
};
const demoPodcast: PodcastInput = {
  ...common,
  kind: "podcast",
  title: "Demo tecnica del lettore audio",
  summary:
    "Segnale sonoro di prova di tre secondi, non un podcast didattico. Volume contenuto; nessuna chiamata AI.",
  author: "Aula · demo",
  origin: "demo",
  audioOrigin: "synthesized",
  chapters: [
    {
      title: "Inizio del segnale",
      start: 0,
      text: "Il segnale serve soltanto a verificare riproduzione e velocità. Non contiene una lezione parlata.",
      page: 1,
    },
    {
      title: "Seconda parte",
      start: 1.5,
      text: "Il pulsante del capitolo sposta l'ascolto a un secondo e mezzo.",
      page: 1,
    },
  ],
};
export function LearningToolsEditor({
  subjects,
  initialDrafts,
  token,
  initialError = "",
}: {
  subjects: Subject[];
  initialDrafts: DraftView[];
  token: string;
  initialError?: string;
}) {
  const [subjectSlug, setSubject] = useState(subjects[0]?.slug ?? ""),
    [drafts, setDrafts] = useState(initialDrafts);
  const [input, setInput] = useState<ToolInput>(blank("map")),
    [selected, setSelected] = useState<DraftView | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null),
    [url, setUrl] = useState(""),
    [demoUrl, setDemoUrl] = useState("");
  const [preview, setPreview] = useState<ToolInput | null>(null),
    [demo, setDemo] = useState<"map" | "podcast" | null>(null);
  const [fileVersion, setFileVersion] = useState(0);
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [message, setMessage] = useState(initialError),
    [isError, setError] = useState(Boolean(initialError));
  const subject = subjects.find((s) => s.slug === subjectSlug),
    available = drafts.filter((d) => d.subjectSlug === subjectSlug);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  useEffect(
    () => () => {
      if (demoUrl) URL.revokeObjectURL(demoUrl);
    },
    [demoUrl],
  );
  function note(text: string, error = false) {
    setMessage(text);
    setError(error);
  }
  function update(next: ToolInput) {
    setInput(next);
    setDirty(true);
    setConfirmed(false);
    setPreview(null);
  }
  function reset(kind: "map" | "podcast") {
    setInput(blank(kind));
    setSelected(null);
    setAudioFile(null);
    setFileVersion((n) => n + 1);
    setUrl("");
    setPreview(null);
    setDemo(null);
    setDirty(false);
    setConfirmed(false);
    note("");
  }
  async function request(body: object | FormData, blob = false) {
    const multipart = body instanceof FormData;
    const response = await fetch("/api/redazione/strumenti", {
      method: "POST",
      headers: {
        "X-Aula-Editor": token,
        ...(multipart ? {} : { "Content-Type": "application/json" }),
      },
      body: multipart ? body : JSON.stringify(body),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "Operazione non riuscita.");
    }
    return blob ? response.blob() : response.json();
  }
  async function run(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } catch (e) {
      note(e instanceof Error ? e.message : "Operazione non riuscita.", true);
    } finally {
      setBusy(false);
    }
  }
  function remember(draft: DraftView) {
    setSelected(draft);
    setDrafts((old) => [draft, ...old.filter((d) => d.id !== draft.id)]);
    setDirty(false);
    setConfirmed(false);
  }
  async function chooseDraft(id: string) {
    const d = drafts.find((v) => v.id === id);
    if (!d) return;
    await run(async () => {
      let nextUrl = "";
      if (d.audio)
        nextUrl = URL.createObjectURL(
          await request(
            { action: "audio", subject: d.subjectSlug, id: d.id },
            true,
          ),
        );
      setSelected(d);
      setInput(d.input);
      setAudioFile(null);
      setFileVersion((n) => n + 1);
      setUrl(nextUrl);
      setPreview(null);
      setDemo(null);
      setDirty(false);
      setConfirmed(false);
      note(
        d.stale
          ? "La fonte è cambiata. Rivedi il contenuto e salva una nuova bozza prima di pubblicare."
          : "Bozza aperta.",
      );
    });
  }
  async function save() {
    if (!subject) return;
    await run(async () => {
      const valid = validateToolInput(input, subject.source.pageCount);
      const form = new FormData();
      form.set(
        "data",
        JSON.stringify({
          subject: subjectSlug,
          sourceSha256: subject.source.sha256,
          input: valid,
          id: selected?.id,
          digest: selected?.digest,
        }),
      );
      if (audioFile) form.set("audio", audioFile);
      const draft: DraftView = await request(form);
      setInput(draft.input);
      setAudioFile(null);
      remember(draft);
      setPreview(draft.input);
      note("Bozza salvata. Controlla l'anteprima prima di pubblicare.");
    });
  }
  async function action(action: "publish" | "withdraw") {
    if (!selected) return;
    await run(async () => {
      const draft: DraftView = await request({
        action,
        subject: subjectSlug,
        id: selected.id,
        digest: selected.digest,
        confirmed,
      });
      remember(draft);
      note(
        action === "publish"
          ? "Strumento pubblicato nel progetto. Apri lo studio della materia per verificarlo."
          : "Strumento ritirato dal progetto. La bozza è conservata.",
      );
    });
  }
  function showPreview() {
    if (!subject) return;
    try {
      const valid = validateToolInput(input, subject.source.pageCount);
      if (valid.kind === "podcast" && !url)
        throw new Error("Scegli un audio da ascoltare nell'anteprima.");
      setPreview(valid);
      setDemo(null);
      note("");
    } catch (e) {
      note(e instanceof Error ? e.message : "Contenuto non valido.", true);
    }
  }
  if (!subject)
    return (
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Mappe e podcast</h2>
        <p className="mt-3">
          Configura prima la fonte principale della materia.
        </p>
      </section>
    );
  return (
    <section
      className="mt-14 border-t border-border pt-10"
      aria-labelledby="media-editor-title"
    >
      <h2 id="media-editor-title" className="text-2xl font-semibold">
        Mappe e podcast
      </h2>
      <p className="mt-3 leading-8 text-muted">
        Lettori e pubblicazione funzionano senza il servizio AI. Puoi modificare
        contenuti con questi campi o importare un JSON prodotto da uno strumento
        esterno. La generazione automatica non è inclusa in questo blocco.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className={button}
          disabled={busy}
          onClick={() => {
            setDemo(demo === "map" ? null : "map");
            setPreview(null);
          }}
        >
          Prova la mappa dimostrativa
        </button>
        <button
          className={button}
          disabled={busy}
          onClick={() =>
            run(async () => {
              if (!demoUrl)
                setDemoUrl(
                  URL.createObjectURL(
                    await request({ action: "demoAudio" }, true),
                  ),
                );
              setDemo(demo === "podcast" ? null : "podcast");
              setPreview(null);
            })
          }
        >
          Prova l&apos;audio dimostrativo
        </button>
      </div>
      {demo && (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-border p-5">
          <p className="font-semibold">
            Demo tecnica locale · non pubblicabile come materiale didattico
          </p>
          {demo === "map" ? (
            <ConceptMap data={demoMap} />
          ) : (
            demoUrl && <PodcastPlayer data={demoPodcast} url={demoUrl} />
          )}
        </div>
      )}
      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Gestione mappe e podcast</legend>
          <Field label="Materia degli strumenti">
            <select
              className={control}
              value={subjectSlug}
              onChange={(e) => {
                setSubject(e.target.value);
                reset("map");
              }}
            >
              {subjects.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Apri una bozza salvata">
            <select
              className={control}
              value={selected?.id ?? ""}
              onChange={(e) => void chooseDraft(e.target.value)}
            >
              <option value="">Scegli una bozza</option>
              {available.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.input.title} ·{" "}
                  {d.stale
                    ? "Fonte cambiata"
                    : d.published
                      ? "Pubblicato"
                      : "Bozza"}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap gap-3">
            <button
              className={button}
              type="button"
              onClick={() => reset("map")}
            >
              Nuova mappa
            </button>
            <button
              className={button}
              type="button"
              onClick={() => reset("podcast")}
            >
              Nuovo episodio
            </button>
          </div>
          <Field label="Importa contenuto JSON (facoltativo)">
            <input
              className={control}
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void run(async () => {
                  if (file.size > 180000)
                    throw new Error("JSON troppo grande.");
                  const valid = validateToolInput(
                    JSON.parse(await file.text()),
                    subject.source.pageCount,
                  );
                  reset(valid.kind);
                  setInput(valid);
                  setDirty(true);
                  note(
                    "Contenuto importato: controlla campi, fonte e anteprima.",
                  );
                });
                e.target.value = "";
              }}
            />
          </Field>
          <p className="text-sm leading-7 text-muted">
            Fonte comune: {subject.source.title} · {subject.source.pageCount}{" "}
            pagine fisiche PDF.
          </p>
          <Field label="Titolo dello strumento">
            <input
              className={control}
              required
              maxLength={140}
              value={input.title}
              onChange={(e) => update({ ...input, title: e.target.value })}
            />
          </Field>
          <Field label="Descrizione dello strumento">
            <textarea
              className={control}
              required
              maxLength={1000}
              rows={3}
              value={input.summary}
              onChange={(e) => update({ ...input, summary: e.target.value })}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Autore o redattore">
              <input
                className={control}
                required
                maxLength={140}
                value={input.author}
                onChange={(e) => update({ ...input, author: e.target.value })}
              />
            </Field>
            <Field label="Provenienza del contenuto">
              <select
                className={control}
                value={input.origin}
                onChange={(e) =>
                  update({
                    ...input,
                    origin: e.target.value as ToolInput["origin"],
                  })
                }
              >
                <option value="human">Contenuto originale</option>
                <option value="ai-assisted">Preparato con supporto AI</option>
                {input.origin === "demo" && (
                  <option value="demo">Demo · non pubblicabile</option>
                )}
              </select>
            </Field>
          </div>
          {input.kind === "map" ? (
            <>
              <h3 className="text-xl font-semibold">Concetti e relazioni</h3>
              {input.nodes.map((node, i) => (
                <fieldset
                  key={node.id}
                  className="space-y-4 rounded-xl border border-border p-4"
                >
                  <legend className="px-2 text-sm font-semibold">
                    Concetto {i + 1}
                  </legend>
                  <Field label={`Nome del concetto ${i + 1}`}>
                    <input
                      className={control}
                      required
                      maxLength={70}
                      value={node.label}
                      onChange={(e) =>
                        update({
                          ...input,
                          nodes: input.nodes.map((n) =>
                            n.id === node.id
                              ? { ...n, label: e.target.value }
                              : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label={`Spiegazione del concetto ${i + 1}`}>
                    <textarea
                      className={control}
                      required
                      rows={3}
                      maxLength={2000}
                      value={node.description}
                      onChange={(e) =>
                        update({
                          ...input,
                          nodes: input.nodes.map((n) =>
                            n.id === node.id
                              ? { ...n, description: e.target.value }
                              : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label={`Pagina fonte del concetto ${i + 1}`}>
                    <input
                      className={control}
                      required
                      type="number"
                      min={1}
                      max={subject.source.pageCount}
                      value={node.page}
                      onChange={(e) =>
                        update({
                          ...input,
                          nodes: input.nodes.map((n) =>
                            n.id === node.id
                              ? { ...n, page: Number(e.target.value) }
                              : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    className={button}
                    disabled={input.nodes.length <= 2}
                    onClick={() =>
                      update({
                        ...input,
                        nodes: input.nodes.filter((n) => n.id !== node.id),
                        links: input.links.filter(
                          (l) => l.from !== node.id && l.to !== node.id,
                        ),
                      })
                    }
                  >
                    Rimuovi concetto {i + 1}
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                className={button}
                disabled={input.nodes.length >= 12}
                onClick={() =>
                  update({
                    ...input,
                    nodes: [
                      ...input.nodes,
                      {
                        id: `n-${crypto.randomUUID()}`,
                        label: "",
                        description: "",
                        page: 1,
                      },
                    ],
                  })
                }
              >
                Aggiungi concetto
              </button>
              {input.links.map((link, i) => (
                <fieldset
                  className="space-y-4 rounded-xl border border-border p-4"
                  key={i}
                >
                  <legend className="px-2 text-sm font-semibold">
                    Relazione {i + 1}
                  </legend>
                  {(["from", "to"] as const).map((key) => (
                    <Field
                      label={`${key === "from" ? "Da" : "A"} · relazione ${i + 1}`}
                      key={key}
                    >
                      <select
                        className={control}
                        value={link[key]}
                        onChange={(e) =>
                          update({
                            ...input,
                            links: input.links.map((l, j) =>
                              j === i ? { ...l, [key]: e.target.value } : l,
                            ),
                          })
                        }
                      >
                        {input.nodes.map((n, j) => (
                          <option key={n.id} value={n.id}>
                            {n.label || `Concetto ${j + 1}`}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ))}
                  <Field label={`Significato della relazione ${i + 1}`}>
                    <input
                      className={control}
                      required
                      maxLength={100}
                      value={link.label}
                      onChange={(e) =>
                        update({
                          ...input,
                          links: input.links.map((l, j) =>
                            j === i ? { ...l, label: e.target.value } : l,
                          ),
                        })
                      }
                    />
                  </Field>
                  <button
                    className={button}
                    type="button"
                    onClick={() =>
                      update({
                        ...input,
                        links: input.links.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Rimuovi relazione {i + 1}
                  </button>
                </fieldset>
              ))}
              <button
                className={button}
                type="button"
                disabled={input.links.length >= 30}
                onClick={() =>
                  update({
                    ...input,
                    links: [
                      ...input.links,
                      {
                        from: input.nodes[0].id,
                        to: input.nodes[1].id,
                        label: "",
                      },
                    ],
                  })
                }
              >
                Aggiungi relazione
              </button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold">Audio e trascrizione</h3>
              <Field label="File audio MP3 o WAV · massimo 10 MB">
                <input
                  key={fileVersion}
                  className={control}
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > AUDIO_LIMIT) {
                      note("Audio troppo grande: massimo 10 MB.", true);
                      e.target.value = "";
                      return;
                    }
                    setAudioFile(file);
                    setUrl(URL.createObjectURL(file));
                    setDirty(true);
                    setConfirmed(false);
                    setPreview(null);
                  }}
                />
              </Field>
              <Field label="Provenienza dell'audio">
                <select
                  className={control}
                  value={input.audioOrigin}
                  onChange={(e) =>
                    update({
                      ...input,
                      audioOrigin: e.target
                        .value as PodcastInput["audioOrigin"],
                    })
                  }
                >
                  <option value="recorded">Registrazione</option>
                  <option value="synthesized">Voce sintetizzata</option>
                </select>
              </Field>
              {input.chapters.map((chapter, i) => (
                <fieldset
                  key={i}
                  className="space-y-4 rounded-xl border border-border p-4"
                >
                  <legend className="px-2 text-sm font-semibold">
                    Capitolo {i + 1}
                  </legend>
                  <Field label={`Titolo capitolo ${i + 1}`}>
                    <input
                      className={control}
                      required
                      maxLength={140}
                      value={chapter.title}
                      onChange={(e) =>
                        update({
                          ...input,
                          chapters: input.chapters.map((c, j) =>
                            i === j ? { ...c, title: e.target.value } : c,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label={`Inizio in secondi · capitolo ${i + 1}`}>
                    <input
                      className={control}
                      required
                      type="number"
                      min={0}
                      step={0.1}
                      value={chapter.start}
                      onChange={(e) =>
                        update({
                          ...input,
                          chapters: input.chapters.map((c, j) =>
                            i === j
                              ? { ...c, start: Number(e.target.value) }
                              : c,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label={`Trascrizione capitolo ${i + 1}`}>
                    <textarea
                      className={control}
                      required
                      maxLength={12000}
                      rows={5}
                      value={chapter.text}
                      onChange={(e) =>
                        update({
                          ...input,
                          chapters: input.chapters.map((c, j) =>
                            i === j ? { ...c, text: e.target.value } : c,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label={`Pagina fonte del capitolo ${i + 1}`}>
                    <input
                      className={control}
                      required
                      type="number"
                      min={1}
                      max={subject.source.pageCount}
                      value={chapter.page}
                      onChange={(e) =>
                        update({
                          ...input,
                          chapters: input.chapters.map((c, j) =>
                            i === j
                              ? { ...c, page: Number(e.target.value) }
                              : c,
                          ),
                        })
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    className={button}
                    disabled={input.chapters.length <= 1}
                    onClick={() =>
                      update({
                        ...input,
                        chapters: input.chapters.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Rimuovi capitolo {i + 1}
                  </button>
                </fieldset>
              ))}
              <button
                type="button"
                className={button}
                disabled={input.chapters.length >= 40}
                onClick={() =>
                  update({
                    ...input,
                    chapters: [
                      ...input.chapters,
                      {
                        title: "",
                        start: input.chapters.at(-1)!.start + 60,
                        text: "",
                        page: 1,
                      },
                    ],
                  })
                }
              >
                Aggiungi capitolo
              </button>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <button className={button} type="button" onClick={showPreview}>
              Mostra anteprima dello strumento
            </button>
            <button className={`${button} bg-emerald-100`} type="submit">
              Salva bozza dello strumento
            </button>
          </div>
        </fieldset>
      </form>
      {message && (
        <p
          className={`mt-5 rounded-xl p-4 text-sm leading-7 ${isError ? "bg-red-50 text-red-900" : "bg-emerald-50 text-ink"}`}
          role={isError ? "alert" : "status"}
        >
          {message}
        </p>
      )}
      {preview && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-border p-5">
          <p className="font-semibold">
            Anteprima · {dirty ? "modifiche non salvate" : "bozza corrente"}
          </p>
          {preview.kind === "map" ? (
            <ConceptMap
              key={selected?.id ?? "new"}
              data={preview}
              source={preview.origin === "demo" ? undefined : subject.source}
            />
          ) : (
            url && (
              <PodcastPlayer
                key={url}
                data={preview}
                url={url}
                source={preview.origin === "demo" ? undefined : subject.source}
              />
            )
          )}
        </div>
      )}
      {selected && (
        <div className="mt-6 rounded-2xl border border-border p-5">
          <p className="font-medium">
            {selected.published
              ? "Versione corrente pubblicata nel progetto"
              : "Bozza da revisionare"}
          </p>
          <label className="mt-4 flex items-start gap-3 text-sm leading-7">
            <input
              className="mt-2 h-4 w-4 shrink-0"
              type="checkbox"
              checked={confirmed}
              disabled={busy || dirty || selected.stale}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              Ho controllato contenuto, collegamenti o audio completo,
              trascrizione e pagine fonte. Confermo la revisione prima della
              pubblicazione.
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className={`${button} bg-emerald-100`}
              disabled={
                busy ||
                dirty ||
                selected.stale ||
                !confirmed ||
                selected.input.origin === "demo"
              }
              onClick={() => void action("publish")}
            >
              Pubblica lo strumento nel progetto
            </button>
            <button
              className={button}
              disabled={busy || dirty || !selected.published}
              onClick={() => void action("withdraw")}
            >
              Ritira lo strumento dal progetto
            </button>
            <a
              className={`${button} inline-flex items-center`}
              href={`/insegnamenti/${subjectSlug}/studio`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apri lo studio della materia
            </a>
          </div>
          {dirty && (
            <p className="mt-3 text-sm leading-7">
              Salva prima le modifiche, poi controlla e conferma la nuova
              versione.
            </p>
          )}
          <p className="mt-3 text-sm leading-7 text-muted">
            Pubblica e ritira modificano i file locali. Commit, push e
            deployment aggiornano il sito online.
          </p>
        </div>
      )}
    </section>
  );
}
