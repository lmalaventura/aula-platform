import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtemp,
  mkdir,
  copyFile,
  readFile,
  writeFile,
  rm,
  access,
  readdir,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { canonicalSource, atomicJson } from "../editor/repository.mts";
import {
  saveTool,
  publishTool,
  withdrawTool,
  readDraft,
  listToolDrafts,
  demoAudio,
  verifyAudio,
  audioBytes,
} from "./repository.mts";
import {
  validateToolInput,
  validateTool,
  audioUrl,
  AUDIO_LIMIT,
  type MapInput,
  type PodcastInput,
} from "../../src/lib/learning-tools/schema.ts";
const map: MapInput = {
  kind: "map",
  title: "TEST: mappa",
  summary: "Fixture tecnica, non contenuto didattico.",
  author: "Test software",
  origin: "ai-assisted",
  nodes: [
    {
      id: "a",
      label: "Concetto A",
      description: "Descrizione tecnica A.",
      page: 4,
    },
    {
      id: "b",
      label: "Concetto B",
      description: "Descrizione tecnica B.",
      page: 6,
    },
  ],
  links: [{ from: "a", to: "b", label: "relazione di prova" }],
};
const podcast: PodcastInput = {
  kind: "podcast",
  title: "TEST: audio",
  summary: "Fixture tecnica, non contenuto didattico.",
  author: "Test software",
  origin: "human",
  audioOrigin: "recorded",
  chapters: [
    { title: "Prima parte", start: 0, text: "Trascrizione di prova.", page: 4 },
    {
      title: "Seconda parte",
      start: 1.5,
      text: "Seconda trascrizione.",
      page: 6,
    },
  ],
};
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "aula-tools-test-"));
  for (const name of [
    "resources.json",
    "subjects.json",
    "study-sources.json",
  ]) {
    const to = path.join(root, "src/content", name);
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(new URL("../../src/content/" + name, import.meta.url), to);
  }
  const file = "public/materials/machine-learning/appunti-machine-learning.pdf";
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await copyFile(
    new URL("../../" + file, import.meta.url),
    path.join(root, file),
  );
  const source = await canonicalSource("machine-learning", root);
  return {
    root,
    source,
    clean: () => rm(root, { recursive: true, force: true }),
  };
}
test("mappa: riferimenti, limiti, pagine e relazioni validati senza conoscenza della materia", () => {
  assert.deepEqual(validateToolInput(map, 60), map);
  for (const bad of [
    { ...map, nodes: [map.nodes[0], map.nodes[0]] },
    { ...map, links: [{ from: "a", to: "missing", label: "non valida" }] },
    { ...map, links: [{ from: "a", to: "a", label: "non valida" }] },
    {
      ...map,
      nodes: [
        ...map.nodes,
        { id: "c", label: "C", description: "Isolato", page: 3 },
      ],
    },
    { ...map, nodes: [{ ...map.nodes[0], page: 999 }, map.nodes[1]] },
  ])
    assert.throws(() => validateToolInput(bad, 60));
  const literal = {
    ...map,
    nodes: [
      { ...map.nodes[0], description: "<script>alert(1)</script>" },
      map.nodes[1],
    ],
  };
  assert.equal(
    (validateToolInput(literal, 60) as MapInput).nodes[0].description,
    literal.nodes[0].description,
  );
});
test("podcast: trascrizioni obbligatorie, secondi finiti e ordine dei capitoli", () => {
  assert.deepEqual(validateToolInput(podcast, 60), podcast);
  for (const chapters of [
    [],
    [{ ...podcast.chapters[0], start: 2 }],
    [podcast.chapters[0], { ...podcast.chapters[1], start: 0 }],
    [{ ...podcast.chapters[0], text: "" }],
    [{ ...podcast.chapters[0], start: NaN }],
    [{ ...podcast.chapters[0], page: 0 }],
  ])
    assert.throws(() => validateToolInput({ ...podcast, chapters }, 60));
});
test("audio: dimensioni, formato e impronta verificati; nessun nome file originale usato come percorso", () => {
  const bytes = demoAudio(),
    audio = verifyAudio(bytes, "wav");
  assert.equal(audio.ext, "wav");
  assert.match(
    audioUrl("machine-learning", audio),
    /^\/media\/study\/machine-learning\/[a-f0-9]{64}\.wav$/,
  );
  assert.throws(() => verifyAudio(bytes, "mp3"));
  assert.throws(() => verifyAudio(Buffer.from("not audio"), "wav"));
  assert.throws(() => verifyAudio(new Uint8Array(AUDIO_LIMIT + 1), "wav"));
  assert.throws(() => audioUrl("../outside", audio));
});
test("salvataggio privato, revisione esplicita, pubblicazione e ritiro reversibile della mappa", async () => {
  const f = await fixture();
  try {
    const d = await saveTool("machine-learning", map, f.source.sha256, {
      root: f.root,
    });
    assert.equal(d.published, false);
    await assert.rejects(
      access(
        path.join(
          f.root,
          "src/content/learning-tools/machine-learning",
          d.id + ".json",
        ),
      ),
    );
    await assert.rejects(
      publishTool("machine-learning", d.id, d.digest, false, f.root),
      /Conferma/,
    );
    const published = await publishTool(
      "machine-learning",
      d.id,
      d.digest,
      true,
      f.root,
    );
    assert.equal(published.published, true);
    const file = path.join(
      f.root,
      "src/content/learning-tools/machine-learning",
      d.id + ".json",
    );
    const contents = JSON.parse(await readFile(file, "utf8"));
    assert.doesNotThrow(() => validateTool(contents, true));
    assert.equal(contents.input.title, map.title);
    await withdrawTool("machine-learning", d.id, d.digest, f.root);
    await assert.rejects(access(file));
    assert.equal(
      (await readDraft("machine-learning", d.id, f.root)).input.kind,
      "map",
    );
  } finally {
    await f.clean();
  }
});
test("modificare una bozza annulla la corrispondenza con la versione pubblicata e rifiuta digest vecchi", async () => {
  const f = await fixture();
  try {
    const d = await saveTool("machine-learning", map, f.source.sha256, {
      root: f.root,
    });
    await publishTool("machine-learning", d.id, d.digest, true, f.root);
    const file = path.join(
        f.root,
        "src/content/learning-tools/machine-learning",
        d.id + ".json",
      ),
      old = await readFile(file, "utf8");
    const edited = await saveTool(
      "machine-learning",
      { ...map, title: "TEST: mappa modificata" },
      f.source.sha256,
      { root: f.root, id: d.id, expectedDigest: d.digest },
    );
    assert.equal(edited.published, false);
    assert.notEqual(edited.digest, d.digest);
    assert.equal(await readFile(file, "utf8"), old);
    await assert.rejects(
      publishTool("machine-learning", d.id, d.digest, true, f.root),
      /cambiata/,
    );
    await assert.rejects(
      saveTool("machine-learning", map, f.source.sha256, {
        root: f.root,
        id: d.id,
        expectedDigest: d.digest,
      }),
      /cambiata/,
    );
    const withdrawn = await withdrawTool(
      "machine-learning",
      edited.id,
      edited.digest,
      f.root,
    );
    assert.equal(withdrawn.published, false);
    await assert.rejects(access(file));
    assert.equal(
      (await readDraft("machine-learning", edited.id, f.root)).input.title,
      "TEST: mappa modificata",
    );
  } finally {
    await f.clean();
  }
});
test("audio privato prima della pubblicazione, riuso, ritiro e rifiuto di file alterati", async () => {
  const f = await fixture();
  try {
    const d = await saveTool("machine-learning", podcast, f.source.sha256, {
      root: f.root,
      audio: { bytes: demoAudio(), ext: "wav" },
    });
    assert.ok(d.audio);
    const publicFile = path.join(
      f.root,
      "public",
      audioUrl("machine-learning", d.audio!).slice(1),
    );
    await assert.rejects(access(publicFile));
    await publishTool("machine-learning", d.id, d.digest, true, f.root);
    assert.deepEqual(await readFile(publicFile), demoAudio());
    const second = await saveTool(
      "machine-learning",
      { ...podcast, title: "TEST: altro episodio" },
      f.source.sha256,
      { root: f.root, audio: { bytes: demoAudio(), ext: "wav" } },
    );
    await publishTool(
      "machine-learning",
      second.id,
      second.digest,
      true,
      f.root,
    );
    await withdrawTool("machine-learning", d.id, d.digest, f.root);
    await access(publicFile);
    await withdrawTool("machine-learning", second.id, second.digest, f.root);
    await assert.rejects(access(publicFile));
    assert.deepEqual(await audioBytes(d, f.root), demoAudio());
    const privateFile = path.join(
      f.root,
      ".aula/editor-tools/audio",
      d.audio!.sha256 + ".wav",
    );
    const changed = demoAudio();
    changed[50] ^= 1;
    await writeFile(privateFile, changed);
    await assert.rejects(
      publishTool("machine-learning", d.id, d.digest, true, f.root),
      /cambiato/,
    );
  } finally {
    await f.clean();
  }
});
test("fonte cambiata: pubblicazione bloccata e vecchie revisioni non trasferite automaticamente", async () => {
  const f = await fixture();
  try {
    const d = await saveTool("machine-learning", map, f.source.sha256, {
      root: f.root,
    });
    const pdf = path.join(f.root, "public", f.source.fileUrl.slice(1)),
      bytes = await readFile(pdf);
    await writeFile(pdf, Buffer.concat([bytes, Buffer.from("\n")]));
    const meta = path.join(f.root, "src/content/resources.json"),
      resources = JSON.parse(await readFile(meta, "utf8"));
    resources.find((r: { id: string }) => r.id === f.source.id).byteSize++;
    await atomicJson(meta, resources);
    assert.equal(
      (await listToolDrafts("machine-learning", f.root))[0].stale,
      true,
    );
    await assert.rejects(
      publishTool("machine-learning", d.id, d.digest, true, f.root),
      /cambiata/,
    );
    await assert.rejects(
      saveTool("machine-learning", map, f.source.sha256, { root: f.root }),
      /cambiati/,
    );
  } finally {
    await f.clean();
  }
});
test("demo, percorsi arbitrari e pubblicazioni senza revisione rifiutati", async () => {
  const f = await fixture();
  try {
    const d = await saveTool(
      "machine-learning",
      { ...map, origin: "demo" },
      f.source.sha256,
      { root: f.root },
    );
    await assert.rejects(
      publishTool("machine-learning", d.id, d.digest, true, f.root),
      /demo/,
    );
    await assert.rejects(readDraft("../outside", d.id, f.root));
    await assert.rejects(
      readDraft("machine-learning", "../../outside", f.root),
    );
    assert.throws(() => validateTool(d, true), /demo/);
    await assert.rejects(
      saveTool("dispositivi-mobili", map, f.source.sha256, { root: f.root }),
    );
    assert.equal(
      (await readdir(path.join(f.root, ".aula/editor-tools/machine-learning")))
        .length,
      1,
    );
  } finally {
    await f.clean();
  }
});

test("cambio computer: gli strumenti pubblicati si riaprono anche senza le bozze locali", async () => {
  const f = await fixture();
  try {
    const draft = await saveTool("machine-learning", podcast, f.source.sha256, {
      root: f.root,
      audio: { bytes: demoAudio(), ext: "wav" },
    });
    await publishTool("machine-learning", draft.id, draft.digest, true, f.root);
    await rm(path.join(f.root, ".aula/editor-tools"), {
      recursive: true,
      force: true,
    });
    const recovered = (await listToolDrafts("machine-learning", f.root))[0];
    assert.equal(recovered.published, true);
    assert.equal(recovered.digest, draft.digest);
    assert.deepEqual(await audioBytes(recovered, f.root), demoAudio());
    await withdrawTool(
      "machine-learning",
      recovered.id,
      recovered.digest,
      f.root,
    );
    assert.deepEqual(
      await audioBytes(
        await readDraft("machine-learning", recovered.id, f.root),
        f.root,
      ),
      demoAudio(),
    );
  } finally {
    await f.clean();
  }
});
test("scritture concorrenti nella stessa materia non si sovrascrivono silenziosamente", async () => {
  const f = await fixture();
  try {
    const results = await Promise.allSettled([
      saveTool("machine-learning", map, f.source.sha256, { root: f.root }),
      saveTool(
        "machine-learning",
        { ...map, title: "TEST: concorrente" },
        f.source.sha256,
        { root: f.root },
      ),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(results.filter((r) => r.status === "rejected").length, 1);
    assert.equal((await listToolDrafts("machine-learning", f.root)).length, 1);
  } finally {
    await f.clean();
  }
});
