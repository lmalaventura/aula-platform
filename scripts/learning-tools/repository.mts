import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
  rename,
  unlink,
  stat,
} from "node:fs/promises";
import path from "node:path";
import {
  canonicalSource,
  atomicJson,
  readJson,
} from "../editor/repository.mts";
import {
  AUDIO_LIMIT,
  audioUrl,
  validId,
  validateToolInput,
  validateTool,
  type ToolDraft,
  type PublishedTool,
  type DraftView,
} from "../../src/lib/learning-tools/schema.ts";
const base = process.cwd();
const shared = globalThis as typeof globalThis & {
  __aulaToolWrites?: Set<string>;
};
async function writeExclusive<T>(
  subject: string,
  root: string,
  task: () => Promise<T>,
) {
  const active = (shared.__aulaToolWrites ??= new Set<string>());
  const key = `${root}:${subject}`;
  if (active.has(key))
    throw new Error(
      "Una modifica della materia è già in corso. Attendi e riprova.",
    );
  active.add(key);
  try {
    return await task();
  } finally {
    active.delete(key);
  }
}
export const toolDigest = (tool: ToolDraft) =>
  createHash("sha256")
    .update(JSON.stringify(validateTool(tool)))
    .digest("hex");
function folder(subject: string, published: boolean, root: string) {
  if (!validId(subject)) throw new Error("Materia non valida.");
  return path.join(
    root,
    published ? "src/content/learning-tools" : ".aula/editor-tools",
    subject,
  );
}
function file(subject: string, id: string, published: boolean, root: string) {
  if (!validId(id)) throw new Error("Strumento non valido.");
  return path.join(folder(subject, published, root), id + ".json");
}
async function names(directory: string) {
  try {
    return (await readdir(directory)).filter((n) => n.endsWith(".json")).sort();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}
export function verifyAudio(bytes: Uint8Array, ext: unknown) {
  if (!bytes.length || bytes.length > AUDIO_LIMIT)
    throw new Error("Audio richiesto, massimo 10 MB.");
  const b = Buffer.from(bytes);
  const wav =
    b.length >= 44 &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WAVE";
  const mp3 =
    b.length >= 16 &&
    (b.toString("ascii", 0, 3) === "ID3" ||
      (b[0] === 0xff && (b[1] & 0xe0) === 0xe0));
  if ((ext !== "wav" || !wav) && (ext !== "mp3" || !mp3))
    throw new Error("Il file deve essere WAV o MP3 con intestazione coerente.");
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    ext: ext as "mp3" | "wav",
  };
}
function privateAudio(tool: ToolDraft, root: string) {
  if (!tool.audio) throw new Error("Audio mancante.");
  return path.join(
    root,
    ".aula/editor-tools/audio",
    `${tool.audio.sha256}.${tool.audio.ext}`,
  );
}
export async function readDraft(subject: string, id: string, root = base) {
  let raw = await readJson<unknown>(file(subject, id, false, root));
  if (!raw) {
    const published = await readJson<unknown>(file(subject, id, true, root));
    if (published) raw = validateTool(published, true);
  }
  if (!raw) throw new Error("Bozza non disponibile.");
  const tool = validateTool(raw);
  if (tool.id !== id || tool.subjectSlug !== subject)
    throw new Error("Bozza collegata alla materia sbagliata.");
  return tool;
}
export async function viewDraft(
  tool: ToolDraft,
  root = base,
): Promise<DraftView> {
  const source = await canonicalSource(tool.subjectSlug, root);
  const raw = await readJson<unknown>(
    file(tool.subjectSlug, tool.id, true, root),
  );
  const published = raw ? validateTool(raw, true) : null;
  return {
    ...tool,
    digest: toolDigest(tool),
    stale: source.sha256 !== tool.source.sha256 || source.id !== tool.source.id,
    published: Boolean(published && toolDigest(published) === toolDigest(tool)),
  };
}
export async function listToolDrafts(subject: string, root = base) {
  const tools: DraftView[] = [];
  const files = new Set([
    ...(await names(folder(subject, false, root))),
    ...(await names(folder(subject, true, root))),
  ]);
  for (const name of [...files].sort())
    tools.push(
      await viewDraft(await readDraft(subject, name.slice(0, -5), root), root),
    );
  return tools;
}
async function saveToolUnlocked(
  subject: string,
  raw: unknown,
  expectedSource: string,
  options: {
    id?: string;
    expectedDigest?: string;
    audio?: { bytes: Uint8Array; ext: string };
    root?: string;
  } = {},
) {
  const root = options.root ?? base,
    source = await canonicalSource(subject, root);
  if (source.sha256 !== expectedSource)
    throw new Error("Gli appunti sono cambiati: ricarica la redazione.");
  const input = validateToolInput(raw, source.pageCount);
  const old = options.id ? await readDraft(subject, options.id, root) : null;
  if (
    old &&
    (toolDigest(old) !== options.expectedDigest ||
      old.input.kind !== input.kind)
  )
    throw new Error("La bozza è cambiata: ricarica la redazione.");
  const tool: ToolDraft = {
    schemaVersion: 1,
    id: old?.id ?? `${input.kind}-${randomUUID()}`,
    subjectSlug: subject,
    source,
    input,
    savedAt: new Date().toISOString(),
  };
  if (input.kind === "podcast") {
    if (options.audio) {
      tool.audio = verifyAudio(options.audio.bytes, options.audio.ext);
      await cacheAudio(tool, options.audio.bytes, root);
    } else if (old?.audio) tool.audio = old.audio;
    else throw new Error("Scegli il file audio per il nuovo episodio.");
    await cacheAudio(tool, await audioBytes(tool, root), root);
  }
  await atomicJson(file(subject, tool.id, false, root), validateTool(tool));
  return viewDraft(tool, root);
}
export async function audioBytes(tool: ToolDraft, root = base) {
  let p = privateAudio(tool, root);
  try {
    await stat(p);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    p = path.join(
      root,
      "public",
      audioUrl(tool.subjectSlug, tool.audio!).slice(1),
    );
  }
  if ((await stat(p)).size > AUDIO_LIMIT)
    throw new Error("Audio troppo grande.");
  const bytes = await readFile(p),
    actual = verifyAudio(bytes, tool.audio!.ext);
  if (actual.sha256 !== tool.audio!.sha256)
    throw new Error("L'audio è cambiato: caricalo nuovamente.");
  return bytes;
}
async function cacheAudio(tool: ToolDraft, bytes: Uint8Array, root: string) {
  const actual = verifyAudio(bytes, tool.audio!.ext);
  if (actual.sha256 !== tool.audio!.sha256)
    throw new Error("Impronta audio non coerente.");
  const p = privateAudio(tool, root);
  await mkdir(path.dirname(p), { recursive: true });
  try {
    await writeFile(p, bytes, { flag: "wx" });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    await audioBytes(tool, root);
  }
}
async function publishToolUnlocked(
  subject: string,
  id: string,
  digest: string,
  confirmed: boolean,
  root = base,
) {
  const tool = await readDraft(subject, id, root),
    current = await canonicalSource(subject, root);
  if (!confirmed)
    throw new Error("Conferma la verifica del contenuto e delle fonti.");
  if (
    toolDigest(tool) !== digest ||
    tool.source.sha256 !== current.sha256 ||
    tool.source.id !== current.id
  )
    throw new Error(
      "Bozza o fonte cambiata: salva e verifica la versione corrente.",
    );
  const published = validateTool(
    { ...tool, reviewedAt: new Date().toISOString() },
    true,
  ) as PublishedTool;
  if (tool.audio) {
    const bytes = await audioBytes(tool, root);
    await cacheAudio(tool, bytes, root);
    const destination = path.join(
      root,
      "public",
      audioUrl(subject, tool.audio).slice(1),
    );
    await mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.${randomUUID()}.tmp`;
    await writeFile(temporary, bytes, { flag: "wx" });
    await rename(temporary, destination);
  }
  await atomicJson(file(subject, id, true, root), published);
  return viewDraft(tool, root);
}
async function withdrawToolUnlocked(
  subject: string,
  id: string,
  digest: string,
  root = base,
) {
  const tool = await readDraft(subject, id, root);
  if (toolDigest(tool) !== digest)
    throw new Error("Bozza cambiata: ricarica la redazione.");
  const p = file(subject, id, true, root),
    old = await readJson<PublishedTool>(p);
  if (old) {
    const published = validateTool(old, true);
    if (tool.audio) await cacheAudio(tool, await audioBytes(tool, root), root);
    await atomicJson(file(subject, id, false, root), tool);
    await unlink(p);
    if (published.audio) {
      const others = await names(folder(subject, true, root));
      let used = false;
      for (const name of others) {
        const other = await readJson<PublishedTool>(
          path.join(folder(subject, true, root), name),
        );
        if (
          other?.audio?.sha256 === published.audio.sha256 &&
          other.audio.ext === published.audio.ext
        )
          used = true;
      }
      if (!used)
        await unlink(
          path.join(
            root,
            "public",
            audioUrl(subject, published.audio).slice(1),
          ),
        ).catch((e) => {
          if (e.code !== "ENOENT") throw e;
        });
    }
  }
  return viewDraft(tool, root);
}
export const saveTool = (...args: Parameters<typeof saveToolUnlocked>) =>
  writeExclusive(args[0], args[3]?.root ?? base, () =>
    saveToolUnlocked(...args),
  );
export const publishTool = (...args: Parameters<typeof publishToolUnlocked>) =>
  writeExclusive(args[0], args[4] ?? base, () => publishToolUnlocked(...args));
export const withdrawTool = (
  ...args: Parameters<typeof withdrawToolUnlocked>
) =>
  writeExclusive(args[0], args[3] ?? base, () => withdrawToolUnlocked(...args));
export function demoAudio() {
  const rate = 16000,
    count = rate * 3,
    b = Buffer.alloc(44 + count * 2);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++)
    b.writeInt16LE(
      Math.round(
        1800 *
          Math.sin((2 * Math.PI * 220 * i) / rate) *
          Math.min(1, i / 800, (count - i) / 800),
      ),
      44 + i * 2,
    );
  return b;
}
