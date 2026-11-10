import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getCanonicalResource } from "@/lib/study/published";
import { audioUrl, validId, validateTool, type PublishedTool } from "./schema";
export function getPublishedTools(subject: string) {
  const result: { tools: PublishedTool[]; outdated: number } = {
    tools: [],
    outdated: 0,
  };
  if (!validId(subject)) throw new Error("Materia non valida.");
  const source = getCanonicalResource(subject);
  const dir = path.join(process.cwd(), "src/content/learning-tools", subject);
  if (!source || !existsSync(dir)) return result;
  const sha = createHash("sha256")
    .update(
      readFileSync(path.join(process.cwd(), "public", source.fileUrl.slice(1))),
    )
    .digest("hex");
  for (const name of readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort()) {
    const tool = validateTool(
      JSON.parse(readFileSync(path.join(dir, name), "utf8")),
      true,
    ) as PublishedTool;
    if (
      tool.subjectSlug !== subject ||
      name !== `${tool.id}.json` ||
      tool.source.id !== source.id ||
      tool.source.fileUrl !== source.fileUrl
    )
      throw new Error("Strumento collegato alla materia sbagliata.");
    if (tool.source.sha256 !== sha) {
      result.outdated++;
      continue;
    }
    if (tool.audio) {
      const bytes = readFileSync(
        path.join(
          process.cwd(),
          "public",
          audioUrl(subject, tool.audio).slice(1),
        ),
      );
      if (
        createHash("sha256").update(bytes).digest("hex") !== tool.audio.sha256
      )
        throw new Error("L'audio pubblicato non corrisponde alla revisione.");
    }
    result.tools.push(tool);
  }
  return result;
}
