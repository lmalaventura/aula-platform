import type { StudyBank } from "./bank";
import type { PublishedTool } from "../learning-tools/schema";
export type StudyMode = "quiz" | "cards" | "exam" | "map" | "podcast";
export type StudyChoice = { id: StudyMode; title: string; description: string };
export function studyChoices(
  bank: StudyBank | null,
  tools: readonly PublishedTool[],
): StudyChoice[] {
  const result: StudyChoice[] = [];
  if (bank?.quiz.length)
    result.push({
      id: "quiz",
      title: "Quiz",
      description: "Metti alla prova quello che sai.",
    });
  if (bank?.flashcards.length)
    result.push({
      id: "cards",
      title: "Flashcard",
      description: "Un concetto, poi il prossimo.",
    });
  if (bank?.quiz.length)
    result.push({
      id: "exam",
      title: "Allenamento",
      description: "Scegli domande e tempo, poi parti.",
    });
  if (tools.some((tool) => tool.input.kind === "map"))
    result.push({
      id: "map",
      title: "Mappe",
      description: "Segui i collegamenti tra le idee.",
    });
  if (tools.some((tool) => tool.input.kind === "podcast"))
    result.push({
      id: "podcast",
      title: "Podcast",
      description: "Mettiti comodo e ascolta.",
    });
  return result;
}
