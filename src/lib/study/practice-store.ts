import type { StudyBank } from "./bank.ts";
import {
  bankRevision,
  emptyPractice,
  finishAttempt,
  validatePractice,
  type PracticeState,
} from "./practice.ts";
export type PracticeSnapshot = {
  state: PracticeState;
  notice: string;
  ready: boolean;
};
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function createPracticeStore(
  bank: StudyBank,
  options: { demo?: boolean; storage?: StoragePort | null } = {},
) {
  const key = `aula:practice:${options.demo ? "demo" : "study"}:v1:${bank.subjectSlug}:${bankRevision(bank)}`;
  const empty = emptyPractice(bank),
    server: PracticeSnapshot = { state: empty, notice: "", ready: false };
  const listeners = new Set<() => void>();
  let port: StoragePort | null = null,
    snapshot: PracticeSnapshot = { state: empty, notice: "", ready: true };
  try {
    port =
      options.storage === undefined
        ? typeof window === "undefined"
          ? null
          : window.localStorage
        : options.storage;
  } catch {
    snapshot.notice =
      "Salvataggio locale non disponibile: puoi allenarti, ma la sessione resta solo in questa pagina.";
  }
  function read(): PracticeSnapshot {
    if (!port) return snapshot;
    try {
      const raw = port.getItem(key);
      if (!raw) return { state: emptyPractice(bank), notice: "", ready: true };
      if (raw.length > 400000) throw new Error("Dati troppo grandi.");
      return {
        state: validatePractice(JSON.parse(raw), bank),
        notice: "",
        ready: true,
      };
    } catch {
      return {
        state: emptyPractice(bank),
        notice:
          "Dati locali non leggibili o non compatibili: puoi iniziare una nuova sessione.",
        ready: true,
      };
    }
  }
  snapshot = read();
  function emit() {
    listeners.forEach((listener) => listener());
  }
  function update(change: (state: PracticeState) => PracticeState) {
    const next = change(snapshot.state);
    if (next === snapshot.state) return;
    let notice = "";
    try {
      if (!port) throw new Error("Unavailable");
      port.setItem(key, JSON.stringify(next));
    } catch {
      notice =
        "Sessione aggiornata, ma il browser non riesce a salvarla: evita di chiudere la pagina se vuoi conservarla.";
    }
    snapshot = { state: next, ready: true, notice };
    emit();
  }
  function onStorage(event: StorageEvent) {
    if (event.key === key || event.key === null) {
      snapshot = read();
      emit();
    }
  }
  return {
    key,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => server,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1 && typeof window !== "undefined")
        window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (!listeners.size && typeof window !== "undefined")
          window.removeEventListener("storage", onStorage);
      };
    },
    update,
    expire(now: number) {
      update((state) =>
        state.active
          ? finishAttempt(state, bank, state.active.id, now, "expired")
          : state,
      );
    },
    reset() {
      let notice = "";
      try {
        port?.removeItem(key);
      } catch {
        notice = "Il browser non ha eliminato i dati salvati.";
      }
      snapshot = { state: emptyPractice(bank), notice, ready: true };
      emit();
    },
  };
}
