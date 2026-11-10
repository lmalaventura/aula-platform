import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  atomicJson,
  prepareDraft,
  loadDraft,
  publishDraft,
  reviewDigest,
  reviewUnit,
  renameTopic,
  contentKey,
} from "./repository.mts";
import { validateBank, selectBank } from "../../src/lib/study/bank.ts";
import { buildEvidencePassages } from "../study/evidence.mts";
import {
  createCloudflareGenerator,
  type StudyGenerator,
} from "../study/cloudflare.mts";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "aula-shared-test-"));
  const bytes = await readFile(
    new URL(
      "../../public/materials/machine-learning/appunti-machine-learning.pdf",
      import.meta.url,
    ),
  );
  const metadata = JSON.parse(
    await readFile(
      new URL("../../src/content/resources.json", import.meta.url),
      "utf8",
    ),
  );
  const resource = metadata.find(
    (r: { id: string }) => r.id === "appunti-machine-learning",
  );
  await mkdir(path.join(root, "public/materials/machine-learning"), {
    recursive: true,
  });
  await writeFile(path.join(root, "public", resource.fileUrl.slice(1)), bytes);
  await atomicJson(path.join(root, "src/content/resources.json"), [resource]);
  await atomicJson(path.join(root, "src/content/subjects.json"), [
    { slug: "machine-learning", title: "Machine Learning" },
  ]);
  await atomicJson(path.join(root, "src/content/study-sources.json"), [
    { subjectSlug: "machine-learning", resourceId: resource.id },
  ]);
  let calls = 0;
  const generate: StudyGenerator = async ({ pages }) => {
    calls++;
    const ps = buildEvidencePassages(pages),
      label = pages.map((p) => p.page).join(" e ");
    return {
      title: `Raccolta di test pagine ${label}`,
      summary:
        "Dati sintetici esclusivamente per verificare il software, non materiale didattico.",
      flashcards: Array.from({ length: 6 }, (_, i) => ({
        front: `Quale concetto verifica la scheda ${i + 1} sulle pagine ${label}?`,
        back: `La risposta di test ${i + 1} dipende dalle fonti.`,
        sourceId: ps[i % ps.length].sourceId,
      })),
      quiz: Array.from({ length: 4 }, (_, i) => ({
        question: `Quale alternativa descrive il test ${i + 1} sulle pagine ${label}?`,
        choices: [
          "Alternativa alfa",
          "Alternativa beta",
          "Alternativa gamma",
          "Alternativa delta",
        ],
        correctIndex: i,
        explanation: `Spiegazione di test ${i + 1}, non contenuto scientifico.`,
        sourceId: ps[i % ps.length].sourceId,
      })),
    };
  };
  return {
    root,
    resource,
    bytes,
    generate,
    calls: () => calls,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test("generazione in blocco crea bozze, non pubblicazioni; riprende e riutilizza le parti pronte", async () => {
  const f = await fixture();
  try {
    const first = await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      maxUnits: 1,
    });
    assert.equal(f.calls(), 1);
    assert.ok(first.topics.length > 1);
    assert.equal(
      await readFile(
        path.join(f.root, "src/content/study-banks/machine-learning.json"),
      ).catch(() => null),
      null,
    );
    const second = await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      maxUnits: 1,
    });
    assert.equal(f.calls(), 2);
    assert.equal(second.units.filter((u) => u.state === "ready").length, 2);
    const firstUnit = (await loadDraft("machine-learning", f.root))!.units.find(
      (u) => u.kit,
    )!;
    await assert.rejects(
      publishDraft("machine-learning", true, f.root),
      /Approva/,
    );
    await assert.rejects(
      reviewUnit(
        "machine-learning",
        firstUnit.id,
        "approved",
        "errato",
        f.root,
      ),
      /cambiata/,
    );
  } finally {
    await f.cleanup();
  }
});

test("errori Cloudflare: conserva HTTP e codici, interrompe senza retry e mantiene le raccolte pronte", async () => {
  const f = await fixture();
  try {
    await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      maxUnits: 1,
    });
    const first = (await loadDraft("machine-learning", f.root))!.units.find(
      (u) => u.kit,
    )!;
    const cachedFile = path.join(
      f.root, ".aula/editor/machine-learning/kits", first.contentKey + ".json",
    );
    const before = await readFile(cachedFile, "utf8");
    const account = "a".repeat(32), token = "DO_NOT_PRINT_THIS_TOKEN";
    for (const [status, code] of [[403, 10000], [429, 3036], [429, 3040], [413, 3006]]) {
      let requests = 0;
      const generate = createCloudflareGenerator({
        CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token,
      }, async () => {
        requests++;
        return new Response(JSON.stringify({
          success: false,
          errors: [{ code, message: `Untrusted response ${token} ${account}` }],
        }), { status });
      });
      await assert.rejects(
        prepareDraft("machine-learning", generate, { root: f.root }),
        (error: Error) => {
          assert.ok(error.message.includes(`HTTP ${status}`));
          assert.ok(error.message.includes(`codici ${code}`));
          assert.ok(!error.message.includes(token));
          assert.ok(!error.message.includes(account));
          assert.ok(!error.message.includes("quota esaurita"));
          return true;
        },
      );
      assert.equal(requests, 1);
      const after = (await loadDraft("machine-learning", f.root))!;
      assert.equal(after.units.filter((u) => u.state === "ready").length, 1);
      assert.equal(after.units.filter((u) => u.state === "failed").length, 1);
      assert.equal(await readFile(cachedFile, "utf8"), before);
    }
  } finally {
    await f.cleanup();
  }
});

test("errori di rete: mostra solo codici riconosciuti, senza messaggi o cause arbitrarie", async () => {
  const f = await fixture();
  try {
    for (const [error, expected] of [
      [new TypeError("fetch failed", {
        cause: Object.assign(new Error("PRIVATE_NETWORK_DETAIL"), { code: "ENOTFOUND" }),
      }), /ENOTFOUND/],
      [new TypeError("fetch failed", {
        cause: { code: "PRIVATE_NETWORK_DETAIL", message: "PRIVATE_NETWORK_DETAIL" },
      }), /connessione/],
      [Object.assign(new Error("PRIVATE_NETWORK_DETAIL"), { name: "TimeoutError" }), /scaduta/],
    ] as const) {
      let requests = 0;
      await assert.rejects(
        prepareDraft("machine-learning", async () => {
          requests++;
          throw error;
        }, { root: f.root }),
        (failure: Error) => {
          assert.match(failure.message, expected);
          assert.ok(!failure.message.includes("PRIVATE_NETWORK_DETAIL"));
          return true;
        },
      );
      assert.equal(requests, 1);
    }
  } finally {
    await f.cleanup();
  }
});

test("configurazione AI mancante: interrompe alla prima parte e indica le variabili da verificare", async () => {
  const f = await fixture();
  let attempts = 0;
  try {
    await assert.rejects(prepareDraft("machine-learning", async (input) => {
      attempts++;
      return createCloudflareGenerator({})(input);
    }, { root: f.root }), /CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN/);
    assert.equal(attempts, 1);
  } finally {
    await f.cleanup();
  }
});

test("pubblica soltanto materiale approvato; selezione per argomento e numero di quesiti derivano dalla banca", async () => {
  const f = await fixture();
  try {
    await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      maxUnits: 2,
    });
    const d = (await loadDraft("machine-learning", f.root))!;
    const units = d.units.filter((u) => u.kit);
    for (const u of units)
      await reviewUnit(
        "machine-learning",
        u.id,
        "approved",
        reviewDigest(u.kit!),
        f.root,
      );
    await assert.rejects(
      publishDraft("machine-learning", false, f.root),
      /parziale/,
    );
    const bank = await publishDraft("machine-learning", true, f.root);
    assert.equal(bank.quiz.length, 8);
    assert.equal(bank.flashcards.length, 12);
    assert.equal(selectBank(bank, "").quiz.length, 8);
    for (const t of bank.topics)
      assert.ok(selectBank(bank, t.id).quiz.every((q) => q.topicId === t.id));
    assert.doesNotThrow(() => validateBank(bank));
    assert.equal(bank.coveredUnits, 2);
    await reviewUnit(
      "machine-learning",
      units[0].id,
      "excluded",
      reviewDigest(units[0].kit!),
      f.root,
    );
    const smaller = await publishDraft("machine-learning", true, f.root);
    assert.equal(smaller.quiz.length, 4);
  } finally {
    await f.cleanup();
  }
});

test("un cambio della fonte invalida la pubblicazione; le parti identiche riusano generazione e revisione", async () => {
  const f = await fixture();
  try {
    await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      maxUnits: 1,
    });
    const old = (await loadDraft("machine-learning", f.root))!,
      unit = old.units.find((u) => u.kit)!;
    await reviewUnit(
      "machine-learning",
      unit.id,
      "approved",
      reviewDigest(unit.kit!),
      f.root,
    );
    await writeFile(
      path.join(f.root, "public", f.resource.fileUrl.slice(1)),
      Buffer.concat([f.bytes, Buffer.from("\n")]),
    );
    f.resource.byteSize++;
    await atomicJson(path.join(f.root, "src/content/resources.json"), [
      f.resource,
    ]);
    assert.equal((await loadDraft("machine-learning", f.root))!.stale, true);
    await assert.rejects(
      publishDraft("machine-learning", true, f.root),
      /fonte è cambiata/,
    );
    await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      maxUnits: 0,
    });
    assert.equal(f.calls(), 1);
    const next = (await loadDraft("machine-learning", f.root))!;
    assert.equal(next.stale, false);
    assert.equal(
      next.units.find((u) => u.id === unit.id)!.review?.decision,
      "approved",
    );
    assert.notEqual(next.source.sha256, old.source.sha256);
  } finally {
    await f.cleanup();
  }
});

test("modificare una risposta toglie la vecchia approvazione, senza sovrascrivere la banca pubblicata", async () => {
  const f = await fixture();
  try {
    await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      maxUnits: 1,
    });
    const d = (await loadDraft("machine-learning", f.root))!,
      u = d.units.find((u) => u.kit)!;
    await reviewUnit(
      "machine-learning",
      u.id,
      "approved",
      reviewDigest(u.kit!),
      f.root,
    );
    await publishDraft("machine-learning", true, f.root);
    const published = await readFile(
      path.join(f.root, "src/content/study-banks/machine-learning.json"),
      "utf8",
    );
    u.kit!.flashcards[0].back =
      "Risposta modificata, da controllare prima di pubblicarla.";
    await atomicJson(
      path.join(
        f.root,
        ".aula/editor/machine-learning/kits",
        u.contentKey + ".json",
      ),
      u.kit,
    );
    assert.equal(
      (await loadDraft("machine-learning", f.root))!.units.find(
        (v) => v.id === u.id,
      )!.review,
      undefined,
    );
    await assert.rejects(
      publishDraft("machine-learning", true, f.root),
      /Approva/,
    );
    assert.equal(
      await readFile(
        path.join(f.root, "src/content/study-banks/machine-learning.json"),
        "utf8",
      ),
      published,
    );
  } finally {
    await f.cleanup();
  }
});

test("stesso nome raggruppa macroargomenti; una fonte principale duplicata e percorsi arbitrari sono rifiutati", async () => {
  const f = await fixture();
  try {
    await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      maxUnits: 3,
    });
    let d = (await loadDraft("machine-learning", f.root))!;
    for (const t of d.topics)
      await renameTopic(
        "machine-learning",
        t.id,
        "Macroargomento comune",
        f.root,
      );
    d = (await loadDraft("machine-learning", f.root))!;
    for (const u of d.units.filter((u) => u.kit))
      await reviewUnit(
        "machine-learning",
        u.id,
        "approved",
        reviewDigest(u.kit!),
        f.root,
      );
    assert.equal(
      (await publishDraft("machine-learning", true, f.root)).topics.length,
      1,
    );
    await assert.rejects(loadDraft("../uscita", f.root), /Insegnamento/);
    await atomicJson(path.join(f.root, "src/content/study-sources.json"), [
      { subjectSlug: "machine-learning", resourceId: f.resource.id },
      { subjectSlug: "machine-learning", resourceId: f.resource.id },
    ]);
    await assert.rejects(
      prepareDraft("machine-learning", f.generate, { root: f.root }),
      /una sola fonte/,
    );
  } finally {
    await f.cleanup();
  }
});

test("dry-run non chiama il provider e non crea bozze; cache dipende dal contenuto e dalla procedura", async () => {
  const f = await fixture();
  try {
    const d = await prepareDraft("machine-learning", f.generate, {
      root: f.root,
      dryRun: true,
    });
    assert.equal(f.calls(), 0);
    assert.ok(d.units.length > 4);
    assert.equal(await loadDraft("machine-learning", f.root), null);
    assert.notEqual(
      contentKey([{ page: 1, text: "testo di prova" }]),
      contentKey([{ page: 2, text: "testo di prova" }]),
    );
  } finally {
    await f.cleanup();
  }
});
