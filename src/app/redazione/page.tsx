import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { connection } from "next/server";
import { getSubjects } from "@/lib/catalog";
import { editorToken, localHost } from "@/lib/editor/guard";
import {
  loadDraft,
  reviewDigest,
} from "../../../scripts/editor/repository.mts";
import { EditorialPanel } from "@/components/editorial-panel";
import type { EditorDraftView } from "@/lib/editor/types";
export default async function EditorialPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  if (!localHost((await headers()).get("host"))) notFound();
  await connection();
  const drafts: EditorDraftView[] = [];
  for (const subject of getSubjects()) {
    const draft = await loadDraft(subject.slug);
    if (draft)
      drafts.push({
        ...draft,
        units: draft.units.map((u) => ({
          ...u,
          ...(u.kit
            ? {
                digest: reviewDigest(u.kit),
                kit: {
                  title: u.kit.title,
                  summary: u.kit.summary,
                  flashcards: u.kit.flashcards,
                  quiz: u.kit.quiz,
                },
              }
            : {}),
        })),
      });
  }
  return (
    <main
      id="contenuto"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8"
    >
      <h1 className="text-3xl font-semibold">Redazione</h1>
      <p className="mt-4 leading-8 text-muted">
        Prepara le attività con study:prepare, controlla le bozze e pubblica la
        banca condivisa. Questa area esiste soltanto sul tuo ambiente locale.
      </p>
      <EditorialPanel drafts={drafts} token={editorToken()} />
    </main>
  );
}
