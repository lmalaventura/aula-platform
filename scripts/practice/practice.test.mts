import assert from "node:assert/strict";
import { test } from "node:test";
import { practiceDemoBank as bank } from "../../src/lib/study/practice-demo.ts";
import { validateBank } from "../../src/lib/study/bank.ts";
import {
  answerAttempt,
  attemptReport,
  bankRevision,
  emptyPractice,
  finishAttempt,
  moveAttempt,
  practicePool,
  startAttempt,
  validatePractice,
} from "../../src/lib/study/practice.ts";
import { createPracticeStore } from "../../src/lib/study/practice-store.ts";
const now = 1800000000000;
const start = (scope = "", count = 4, minutes = 0) =>
  startAttempt(emptyPractice(bank), bank, {
    id: "attempt-1",
    scope,
    count,
    minutes,
    now,
    random: () => 0.25,
  });
function port() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}
test("demo valida e selezione derivata dalla banca, per macroargomento e senza duplicati", () => {
  assert.doesNotThrow(() => validateBank(bank));
  const scope = bank.topics[0].id;
  const s = start(scope, 4);
  assert.equal(s.active!.questionIds.length, 4);
  assert.equal(new Set(s.active!.questionIds).size, 4);
  assert.ok(
    s.active!.questionIds.every((id) =>
      practicePool(bank, scope).some((q) => q.id === id),
    ),
  );
  assert.throws(() => start(scope, 5));
  assert.throws(() => start("topic-inventato"));
  assert.throws(() => start("", 0));
  assert.throws(() => start("", 4, 181));
  assert.throws(() =>
    startAttempt(s, bank, { id: "new", scope: "", count: 1, minutes: 0, now }),
  );
});
test("correzione distingue corrette, errate e non risposte con risultati per argomento", () => {
  let s = start();
  const ids = s.active!.questionIds;
  for (let i = 0; i < 3; i++) {
    s = moveAttempt(s, "attempt-1", i);
    const q = bank.quiz.find((q) => q.id === ids[i])!;
    s = answerAttempt(
      s,
      bank,
      "attempt-1",
      i === 2 ? (q.correctIndex + 1) % 4 : q.correctIndex,
      now + 1000,
    );
  }
  s = finishAttempt(s, bank, "attempt-1", now + 2000, "submitted");
  const report = attemptReport(bank, s.last!);
  assert.equal(report.correct.length, 2);
  assert.equal(report.wrong.length, 1);
  assert.equal(report.unanswered.length, 1);
  assert.equal(report.review.length, 2);
  assert.equal(
    report.topics.reduce((n, t) => n + t.total, 0),
    4,
  );
  assert.equal(s.history[0].correct, 2);
  assert.equal(s.active, null);
  assert.doesNotThrow(() => validatePractice(s, bank));
});
test("scadenza assoluta, risposta tardiva bloccata e chiusura idempotente", () => {
  const s = start("", 4, 5),
    deadline = s.active!.deadline!;
  assert.equal(deadline, now + 300000);
  assert.equal(finishAttempt(s, bank, "attempt-1", deadline - 1, "expired"), s);
  const closed = answerAttempt(s, bank, "attempt-1", 0, deadline);
  assert.equal(closed.last!.reason, "expired");
  assert.deepEqual(closed.last!.answers, {});
  assert.equal(closed.last!.finishedAt, deadline);
  assert.equal(
    finishAttempt(closed, bank, "attempt-1", deadline + 10000, "expired"),
    closed,
  );
  assert.equal(closed.history.length, 1);
});
test("ripasso raccoglie errori e non risposte; una risposta corretta li toglie dalla lista", () => {
  let s = finishAttempt(start(), bank, "attempt-1", now + 1000, "submitted");
  assert.equal(s.wrongIds.length, 4);
  const old = [...s.wrongIds];
  s = startAttempt(s, bank, {
    id: "review",
    scope: "",
    count: 4,
    minutes: 0,
    now: now + 2000,
    wrongOnly: true,
    random: () => 0.25,
  });
  assert.deepEqual(new Set(s.active!.questionIds), new Set(old));
  const id = s.active!.questionIds[0],
    q = bank.quiz.find((q) => q.id === id)!;
  s = answerAttempt(s, bank, "review", q.correctIndex, now + 2500);
  s = finishAttempt(s, bank, "review", now + 3000, "submitted");
  assert.equal(s.wrongIds.length, 3);
  assert.ok(!s.wrongIds.includes(id));
  assert.equal(
    practicePool(bank, bank.topics[0].id, s.wrongIds).every(
      (q) => q.topicId === bank.topics[0].id,
    ),
    true,
  );
});
test("posizioni e risposte invalide rifiutate; eventi di una vecchia sessione ignorati", () => {
  const s = start();
  assert.throws(() => moveAttempt(s, "attempt-1", -1));
  assert.throws(() => moveAttempt(s, "attempt-1", 4));
  assert.throws(() => answerAttempt(s, bank, "attempt-1", 4, now + 1));
  assert.throws(() => answerAttempt(s, bank, "attempt-1", 0, NaN));
  assert.equal(answerAttempt(s, bank, "stale", 0, now + 1), s);
  assert.equal(moveAttempt(s, "stale", 1), s);
});
test("ripresa dal browser conserva domande, posizione, risposte e scadenza", () => {
  const storage = port(),
    one = createPracticeStore(bank, { storage });
  one.update(() => start("", 4, 5));
  one.update((s) => answerAttempt(s, bank, "attempt-1", 2, now + 1000));
  one.update((s) => moveAttempt(s, "attempt-1", 1));
  const two = createPracticeStore(bank, { storage });
  assert.deepEqual(two.getSnapshot().state, one.getSnapshot().state);
  assert.equal(two.getSnapshot().state.active!.position, 1);
  two.expire(now + 300001);
  assert.equal(two.getSnapshot().state.last!.finishedAt, now + 300000);
  assert.equal(
    createPracticeStore(bank, { storage }).getSnapshot().state.last!.reason,
    "expired",
  );
});
test("versioni della fonte o delle domande e demo hanno spazi di salvataggio separati", () => {
  const storage = port(),
    one = createPracticeStore(bank, { storage });
  one.update(() => start());
  const changed = structuredClone(bank);
  changed.quiz[0].choices[0] += " modificata";
  assert.notEqual(bankRevision(bank), bankRevision(changed));
  assert.equal(
    createPracticeStore(changed, { storage }).getSnapshot().state.active,
    null,
  );
  assert.notEqual(
    createPracticeStore(bank, { storage, demo: true }).key,
    one.key,
  );
  const source = structuredClone(bank);
  source.sourceSha256 = "a".repeat(64);
  assert.notEqual(bankRevision(bank), bankRevision(source));
  const same = { ...bank, publishedAt: "2026-02-01T00:00:00.000Z" };
  assert.equal(bankRevision(bank), bankRevision(same));
});
test("dati locali alterati rifiutati senza eseguire contenuti o perdere la possibilità di studiare", () => {
  const s = start();
  const invalid = [
    { ...s, revision: "old" },
    { ...s, wrongIds: ["unknown"] },
    { ...s, active: { ...s.active, questionIds: ["unknown"] } },
    {
      ...s,
      active: { ...s.active, answers: { [s.active!.questionIds[0]]: 99 } },
    },
    { ...s, active: { ...s.active, deadline: 1 } },
  ];
  for (const v of invalid) assert.throws(() => validatePractice(v, bank));
  const storage = port(),
    store = createPracticeStore(bank, { storage });
  storage.map.set(store.key, '{"active": "<script>"}');
  const loaded = createPracticeStore(bank, { storage });
  assert.equal(loaded.getSnapshot().state.active, null);
  assert.ok(loaded.getSnapshot().notice);
  loaded.update(() => start());
  assert.equal(loaded.getSnapshot().state.active!.id, "attempt-1");
});
test("storage bloccato o pieno: lo studio continua in memoria con avviso", () => {
  const broken = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("full");
    },
    removeItem() {
      throw Error("blocked");
    },
  };
  const store = createPracticeStore(bank, { storage: broken });
  assert.ok(store.getSnapshot().notice);
  store.update(() => start());
  assert.equal(store.getSnapshot().state.active!.id, "attempt-1");
  assert.ok(store.getSnapshot().notice);
  store.reset();
  assert.equal(store.getSnapshot().state.active, null);
  assert.ok(store.getSnapshot().notice);
});
test("cronologia limitata a dieci sessioni e azzeramento circoscritto alla banca corrente", () => {
  const storage = port(),
    store = createPracticeStore(bank, { storage });
  let s = emptyPractice(bank);
  for (let i = 0; i < 12; i++) {
    const id = "attempt-" + i;
    s = startAttempt(s, bank, {
      id,
      scope: "",
      count: 1,
      minutes: 0,
      now: now + i * 2000,
    });
    s = finishAttempt(s, bank, id, now + i * 2000 + 1000, "submitted");
  }
  assert.equal(s.history.length, 10);
  assert.equal(s.history[0].id, "attempt-11");
  assert.doesNotThrow(() => validatePractice(s, bank));
  store.update(() => s);
  storage.setItem("unrelated", "keep");
  store.reset();
  assert.equal(storage.getItem(store.key), null);
  assert.equal(storage.getItem("unrelated"), "keep");
  assert.equal(store.getSnapshot().state.history.length, 0);
});
