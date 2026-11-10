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
import { LearningToolsEditor } from "@/components/learning-tools-editor";
import { canonicalSource } from "../../../scripts/editor/repository.mts";
import { listToolDrafts } from "../../../scripts/learning-tools/repository.mts";
import type { DraftView, ToolSource } from "@/lib/learning-tools/schema";
import type { EditorDraftView } from "@/lib/editor/types";
import { PracticeDemo } from "@/components/practice-demo";
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
  const toolSubjects: { slug: string; title: string; source: ToolSource }[] =
    [];
  const toolDrafts: DraftView[] = [];
  let toolError = "";
  for (const subject of getSubjects()) {
    try {
      const source = await canonicalSource(subject.slug);
      toolSubjects.push({ slug: subject.slug, title: subject.title, source });
      toolDrafts.push(...(await listToolDrafts(subject.slug)));
    } catch {
      toolError =
        "Una fonte o bozza di mappe/podcast non è disponibile. Controlla i file di contenuto della materia e ricarica la redazione.";
    }
  }
  return (
    <main
      id="contenuto"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8"
    >
      <h1 className="text-3xl font-semibold">Redazione</h1>
      <p className="mt-4 leading-8 text-muted">
        Gestisci attività condivise e contributi. Le demo permettono di provare
        gli strumenti senza generazione AI. Questa area esiste soltanto sul tuo
        ambiente locale.
      </p>
      <nav
        className="mt-5 flex flex-wrap gap-3"
        aria-label="Sezioni della redazione"
      >
        <a
          className="inline-flex min-h-12 items-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-emerald-50"
          href="#redazione-quiz"
        >
          Quiz e flashcard
        </a>
        <a
          className="inline-flex min-h-12 items-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-emerald-50"
          href="#media-editor-title"
        >
          Mappe e podcast
        </a>
        <a
          className="inline-flex min-h-12 items-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-emerald-50"
          href="#practice-demo-title"
        >
          Allenamento
        </a>
      </nav>
      <div id="redazione-quiz">
        <EditorialPanel drafts={drafts} token={editorToken()} />
      </div>
      <LearningToolsEditor
        subjects={toolSubjects}
        initialDrafts={toolDrafts}
        token={editorToken()}
        initialError={toolError}
      />
      <PracticeDemo />
    </main>
  );
}
