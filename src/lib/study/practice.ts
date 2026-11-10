import type { StudyBank } from "./bank.ts";

export type Attempt = {
  id: string;
  scope: string;
  questionIds: string[];
  answers: Record<string, number>;
  position: number;
  startedAt: number;
  deadline: number | null;
  minutes: number;
};
export type CompletedAttempt = Attempt & {
  finishedAt: number;
  reason: "submitted" | "expired";
};
export type AttemptSummary = {
  id: string;
  scope: string;
  finishedAt: number;
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  reason: "submitted" | "expired";
};
export type PracticeState = {
  version: 1;
  revision: string;
  active: Attempt | null;
  last: CompletedAttempt | null;
  history: AttemptSummary[];
  wrongIds: string[];
};

// Identifica la versione locale dei dati: non è una firma o una protezione antimanomissione.
export function bankRevision(bank: StudyBank) {
  const text = JSON.stringify([bank.sourceSha256, bank.topics, bank.quiz]);
  let a = 2166136261,
    b = 5381;
  for (let i = 0; i < text.length; i++) {
    a = Math.imul(a ^ text.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ text.charCodeAt(i);
  }
  return `${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`;
}
export function emptyPractice(bank: StudyBank): PracticeState {
  return {
    version: 1,
    revision: bankRevision(bank),
    active: null,
    last: null,
    history: [],
    wrongIds: [],
  };
}
export function practicePool(
  bank: StudyBank,
  scope: string,
  wrongIds?: string[],
) {
  const wrong = wrongIds ? new Set(wrongIds) : null;
  return bank.quiz.filter(
    (q) => (!scope || q.topicId === scope) && (!wrong || wrong.has(q.id)),
  );
}
function validScope(bank: StudyBank, scope: unknown): scope is string {
  return (
    scope === "" ||
    (typeof scope === "string" && bank.topics.some((t) => t.id === scope))
  );
}
function timestamp(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value < 8e15
  );
}
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function validateAttempt(
  value: unknown,
  bank: StudyBank,
  completed: boolean,
): Attempt | CompletedAttempt {
  if (!record(value)) throw new Error("Sessione non valida.");
  const x = value;
  if (
    typeof x.id !== "string" ||
    !/^[a-z0-9-]{1,80}$/.test(x.id) ||
    !validScope(bank, x.scope) ||
    !Array.isArray(x.questionIds) ||
    !x.questionIds.length ||
    x.questionIds.length > bank.quiz.length ||
    new Set(x.questionIds).size !== x.questionIds.length ||
    !Number.isSafeInteger(x.position) ||
    (x.position as number) < 0 ||
    (x.position as number) >= x.questionIds.length ||
    !timestamp(x.startedAt) ||
    !Number.isSafeInteger(x.minutes) ||
    (x.minutes as number) < 0 ||
    (x.minutes as number) > 180 ||
    !record(x.answers)
  )
    throw new Error("Sessione non valida.");
  const allowed = new Map(practicePool(bank, x.scope).map((q) => [q.id, q]));
  if (x.questionIds.some((id) => typeof id !== "string" || !allowed.has(id)))
    throw new Error("Domande non più disponibili.");
  const ids = x.questionIds as string[];
  if (
    Object.keys(x.answers).some(
      (id) =>
        !ids.includes(id) ||
        !Number.isSafeInteger((x.answers as Record<string, unknown>)[id]) ||
        (x.answers as Record<string, number>)[id] < 0 ||
        (x.answers as Record<string, number>)[id] >=
          allowed.get(id)!.choices.length,
    )
  )
    throw new Error("Risposte non valide.");
  const expected = x.minutes
    ? x.startedAt + (x.minutes as number) * 60000
    : null;
  if (x.deadline !== expected) throw new Error("Scadenza non valida.");
  const attempt: Attempt = {
    id: x.id,
    scope: x.scope,
    questionIds: ids,
    answers: { ...x.answers } as Record<string, number>,
    position: x.position as number,
    startedAt: x.startedAt,
    deadline: expected,
    minutes: x.minutes as number,
  };
  if (completed) {
    if (
      !timestamp(x.finishedAt) ||
      x.finishedAt < x.startedAt ||
      !["submitted", "expired"].includes(String(x.reason)) ||
      (x.reason === "expired" &&
        (expected === null || x.finishedAt !== expected)) ||
      (expected !== null && x.finishedAt > expected)
    )
      throw new Error("Risultato non valido.");
    return {
      ...attempt,
      finishedAt: x.finishedAt,
      reason: x.reason as CompletedAttempt["reason"],
    };
  }
  return attempt;
}
export function validatePractice(
  value: unknown,
  bank: StudyBank,
): PracticeState {
  if (
    !record(value) ||
    value.version !== 1 ||
    value.revision !== bankRevision(bank) ||
    !Array.isArray(value.history) ||
    value.history.length > 10 ||
    !Array.isArray(value.wrongIds) ||
    new Set(value.wrongIds).size !== value.wrongIds.length ||
    value.wrongIds.some(
      (id) => typeof id !== "string" || !bank.quiz.some((q) => q.id === id),
    )
  )
    throw new Error("Dati locali non compatibili con la banca corrente.");
  const active =
    value.active === null
      ? null
      : (validateAttempt(value.active, bank, false) as Attempt);
  const last =
    value.last === null
      ? null
      : (validateAttempt(value.last, bank, true) as CompletedAttempt);
  if (active && active.id === last?.id) throw new Error("Sessione duplicata.");
  const history = value.history.map((raw): AttemptSummary => {
    if (
      !record(raw) ||
      typeof raw.id !== "string" ||
      !/^[a-z0-9-]{1,80}$/.test(raw.id) ||
      !validScope(bank, raw.scope) ||
      !timestamp(raw.finishedAt) ||
      !["submitted", "expired"].includes(String(raw.reason)) ||
      [raw.correct, raw.wrong, raw.unanswered, raw.total].some(
        (n) => !Number.isSafeInteger(n) || (n as number) < 0,
      ) ||
      raw.total !==
        (raw.correct as number) +
          (raw.wrong as number) +
          (raw.unanswered as number) ||
      (raw.total as number) < 1 ||
      (raw.total as number) > bank.quiz.length
    )
      throw new Error("Cronologia non valida.");
    return {
      id: raw.id,
      scope: raw.scope,
      finishedAt: raw.finishedAt,
      correct: raw.correct as number,
      wrong: raw.wrong as number,
      unanswered: raw.unanswered as number,
      total: raw.total as number,
      reason: raw.reason as CompletedAttempt["reason"],
    };
  });
  if (new Set(history.map((h) => h.id)).size !== history.length)
    throw new Error("Risultati duplicati.");
  return {
    version: 1,
    revision: value.revision,
    active,
    last,
    history,
    wrongIds: value.wrongIds as string[],
  };
}
export function startAttempt(
  state: PracticeState,
  bank: StudyBank,
  options: {
    id: string;
    scope: string;
    count: number;
    minutes: number;
    now: number;
    wrongOnly?: boolean;
    random?: () => number;
  },
): PracticeState {
  if (state.active)
    throw new Error("Riprendi o termina prima la sessione in corso.");
  if (
    !validScope(bank, options.scope) ||
    !Number.isSafeInteger(options.minutes) ||
    options.minutes < 0 ||
    options.minutes > 180 ||
    !timestamp(options.now)
  )
    throw new Error("Impostazioni della sessione non valide.");
  const pool = practicePool(
    bank,
    options.scope,
    options.wrongOnly ? state.wrongIds : undefined,
  ).map((q) => q.id);
  if (
    !Number.isSafeInteger(options.count) ||
    options.count < 1 ||
    options.count > pool.length
  )
    throw new Error("Numero di domande non disponibile nella selezione.");
  const random = options.random ?? Math.random;
  for (let i = pool.length - 1; i > 0; i--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
      throw new Error("Estrazione non valida.");
    const j = Math.floor(value * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const active: Attempt = {
    id: options.id,
    scope: options.scope,
    questionIds: pool.slice(0, options.count),
    answers: {},
    position: 0,
    startedAt: options.now,
    deadline: options.minutes ? options.now + options.minutes * 60000 : null,
    minutes: options.minutes,
  };
  validateAttempt(active, bank, false);
  return { ...state, active };
}
export function attemptReport(bank: StudyBank, attempt: Attempt) {
  const questions = attempt.questionIds.map((id) =>
    bank.quiz.find((q) => q.id === id)!,
  );
  const correct = questions.filter(
      (q) => attempt.answers[q.id] === q.correctIndex,
    ),
    unanswered = questions.filter((q) => attempt.answers[q.id] === undefined),
    wrong = questions.filter(
      (q) =>
        attempt.answers[q.id] !== undefined &&
        attempt.answers[q.id] !== q.correctIndex,
    );
  return {
    questions,
    correct,
    wrong,
    unanswered,
    review: questions.filter((q) => attempt.answers[q.id] !== q.correctIndex),
    topics: bank.topics
      .map((t) => {
        const qs = questions.filter((q) => q.topicId === t.id);
        return {
          ...t,
          total: qs.length,
          correct: qs.filter((q) => attempt.answers[q.id] === q.correctIndex)
            .length,
        };
      })
      .filter((t) => t.total),
  };
}
export function finishAttempt(
  state: PracticeState,
  bank: StudyBank,
  id: string,
  now: number,
  reason: CompletedAttempt["reason"],
): PracticeState {
  if (!timestamp(now)) throw new Error("Orario della sessione non valido.");
  const active = state.active;
  if (!active || active.id !== id) return state;
  const expired = active.deadline !== null && now >= active.deadline;
  if (reason === "expired" && !expired) return state;
  const last: CompletedAttempt = {
    ...active,
    reason: expired ? "expired" : "submitted",
    finishedAt: expired ? active.deadline! : Math.max(active.startedAt, now),
  };
  const report = attemptReport(bank, active),
    wrong = new Set(state.wrongIds);
  report.correct.forEach((q) => wrong.delete(q.id));
  report.review.forEach((q) => wrong.add(q.id));
  const summary: AttemptSummary = {
    id,
    scope: active.scope,
    finishedAt: last.finishedAt,
    correct: report.correct.length,
    wrong: report.wrong.length,
    unanswered: report.unanswered.length,
    total: report.questions.length,
    reason: last.reason,
  };
  return {
    ...state,
    active: null,
    last,
    wrongIds: [...wrong],
    history: [summary, ...state.history.filter((h) => h.id !== id)].slice(
      0,
      10,
    ),
  };
}
export function answerAttempt(
  state: PracticeState,
  bank: StudyBank,
  id: string,
  choice: number,
  now: number,
) {
  if (!timestamp(now)) throw new Error("Orario della sessione non valido.");
  const active = state.active;
  if (!active || active.id !== id) return state;
  if (active.deadline !== null && now >= active.deadline)
    return finishAttempt(state, bank, id, now, "expired");
  const q = bank.quiz.find(
    (q) => q.id === active.questionIds[active.position],
  )!;
  if (!Number.isSafeInteger(choice) || choice < 0 || choice >= q.choices.length)
    throw new Error("Risposta non valida.");
  return {
    ...state,
    active: { ...active, answers: { ...active.answers, [q.id]: choice } },
  };
}
export function moveAttempt(
  state: PracticeState,
  id: string,
  position: number,
) {
  if (!state.active || state.active.id !== id) return state;
  if (
    !Number.isSafeInteger(position) ||
    position < 0 ||
    position >= state.active.questionIds.length
  )
    throw new Error("Posizione non valida.");
  return { ...state, active: { ...state.active, position } };
}
