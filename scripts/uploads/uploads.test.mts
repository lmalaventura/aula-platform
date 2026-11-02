import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { getPublicUploadConfig, inspectPdf, MAX_UPLOAD_BYTES, validateUploadInput } from "../../src/lib/uploads/validation.ts";
import { createUploadsRepository, uploadError } from "../../src/lib/uploads/repository.ts";
import type { Upload, UploadDatabase } from "../../src/lib/uploads/types.ts";

const input = { subjectSlug: "machine-learning", title: "  Lezione 1  ", authorName: "  Mario Rossi  ", rightsConfirmed: true };
const pdf = () => new File(["%PDF-1.7\nEsempio solo per test"], "lezione.pdf", { type: "application/pdf" });
const row: Upload = {
  id: "11111111-1111-4111-8111-111111111111", owner_id: "22222222-2222-4222-8222-222222222222",
  subject_slug: "machine-learning", title: "Lezione 1", author_name: "Mario Rossi", original_name: "lezione.pdf",
  byte_size: pdf().size, sha256: "a".repeat(64), rights_confirmed: true,
  object_path: "22222222-2222-4222-8222-222222222222/11111111-1111-4111-8111-111111111111.pdf",
  status: "uploading", created_at: "2026-10-30T10:00:00Z",
};

function fixture(failAt = "") {
  const calls: { path: string; method: string; body: unknown }[] = [];
  const client = createClient<UploadDatabase>("https://aula-test.supabase.co", "sb_publishable_test", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url, init) => {
      const path = new URL(String(url)).pathname;
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
      calls.push({ path, method: init?.method ?? "GET", body });
      if (path.includes(failAt) && failAt) return Response.json({ code: "42501", message: "denied", error: "denied" }, { status: 403 });
      if (path.endsWith("aula_can_contribute")) return Response.json(true);
      if (path.endsWith("aula_uploads")) return Response.json(init?.method === "POST" ? row : [row]);
      if (path.includes("/rpc/")) return new Response(null, { status: 204 });
      return Response.json({ Key: row.object_path });
    } },
  });
  return { repository: createUploadsRepository(client), calls };
}

test("metadati normalizzati, materia disponibile e conferma necessaria", () => {
  assert.equal(validateUploadInput(input, ["machine-learning"]).title, "Lezione 1");
  assert.throws(() => validateUploadInput(input, ["altro"]));
  assert.throws(() => validateUploadInput({ ...input, rightsConfirmed: false }, ["machine-learning"]));
  assert.throws(() => validateUploadInput({ ...input, title: "a" }, ["machine-learning"]));
});
test("PDF: impronta stabile, estensione, intestazione e dimensione", async () => {
  assert.match(await inspectPdf(pdf()), /^[a-f0-9]{64}$/);
  assert.equal(await inspectPdf(pdf()), await inspectPdf(pdf()));
  await assert.rejects(inspectPdf(new File(["%PDF-"], "appunti.txt")));
  await assert.rejects(inspectPdf(new File(["non pdf"], "appunti.pdf")));
  await assert.rejects(inspectPdf(new File([""], "appunti.pdf")));
  await assert.rejects(inspectPdf(new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "grande.pdf")));
});
test("configurazione pubblica rifiuta chiavi segrete e URL estranei", () => {
  assert.equal(getPublicUploadConfig(undefined, undefined), null);
  assert.equal(getPublicUploadConfig("https://aula-test.supabase.co", "sb_secret_test"), null);
  assert.equal(getPublicUploadConfig("https://example.com", "sb_publishable_test"), null);
  assert.equal(getPublicUploadConfig("http://aula-test.supabase.co", "sb_publishable_test"), null);
  assert.equal(getPublicUploadConfig("https://aula-test.supabase.co/path", "sb_publishable_test"), null);
  assert.equal(getPublicUploadConfig("https://aula-test.supabase.co", "sb_publishable_test")?.url, "https://aula-test.supabase.co");
});
test("flusso SDK: prenota metadati, carica, conferma, senza riscrivere file", async () => {
  const { repository, calls } = fixture();
  await repository.add(input, pdf(), [input.subjectSlug]);
  assert.equal(calls.length, 3);
  assert.ok(calls[0].path.endsWith("aula_uploads"));
  assert.ok(calls[1].path.includes("/storage/v1/object/aula-private/"));
  assert.ok(calls[2].path.endsWith("aula_complete_upload"));
  assert.equal((calls[0].body as { title: string }).title, "Lezione 1");
  assert.equal((calls[0].body as Record<string, unknown>).owner_id, undefined);
});
test("file non valido rifiutato prima della prenotazione remota", async () => {
  const { repository, calls } = fixture();
  await assert.rejects(repository.add(input, new File(["errore"], "falso.pdf"), [input.subjectSlug]));
  assert.equal(calls.length, 0);
});
test("upload fallito: nessuna conferma né eliminazione silenziosa della prenotazione", async () => {
  const { repository, calls } = fixture("/storage/");
  await assert.rejects(repository.add(input, pdf(), [input.subjectSlug]));
  assert.equal(calls.length, 2);
  assert.ok(!calls.some((call) => call.path.includes("complete") || call.method === "DELETE"));
});
test("conferma fallita: il precedente invio del file non è annullato", async () => {
  const { repository, calls } = fixture("aula_complete_upload");
  await assert.rejects(repository.add(input, pdf(), [input.subjectSlug]));
  assert.equal(calls.length, 3);
});
test("eliminazione: prima Storage poi metadati; fallimento Storage blocca il secondo passo", async () => {
  const ok = fixture(); await ok.repository.remove(row);
  assert.ok(ok.calls[0].path.includes("/storage/"));
  assert.ok(ok.calls[1].path.endsWith("aula_delete_upload"));
  const failed = fixture("/storage/"); await assert.rejects(failed.repository.remove(row));
  assert.equal(failed.calls.length, 1);
});
test("letture e verifica del caricamento usano il repository comune", async () => {
  const { repository } = fixture();
  assert.equal(await repository.canContribute(), true);
  assert.equal((await repository.list())[0].id, row.id);
  await repository.complete(row.id);
});
test("messaggi mostrati all'utente non espongono risposte remote arbitrarie", () => {
  assert.match(uploadError({ code: "23505" }), /già caricato/);
  assert.match(uploadError({ message: "AULA_FILE_MISSING" }), /non è arrivato/);
  assert.ok(!uploadError({ message: "PRIVATE DEBUG RESPONSE" }).includes("PRIVATE"));
});
