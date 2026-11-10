import type {
  EditorDraft,
  EditorUnit,
} from "../../../scripts/editor/repository.mts";
import type { StudyKit } from "../study/schema";
export type EditorDraftView = Omit<EditorDraft, "units"> & {
  units: (Omit<EditorUnit, "kit"> & {
    kit?: Pick<StudyKit, "title" | "summary" | "flashcards" | "quiz">;
    digest?: string;
  })[];
};
export type ContributionRow = {
  id: string;
  subject_slug: string;
  title: string;
  author_name: string;
  original_name: string;
  status: "pending" | "accepted" | "changes_requested" | "rejected";
  note: string;
};
