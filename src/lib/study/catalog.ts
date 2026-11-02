// Solo server: lettura dei risultati preparati, senza chiamate AI durante build o navigazione.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { getResourceById } from "@/lib/catalog/resources";
import { STUDY_MODEL, STUDY_VERSION, validateStudyKit } from "./schema";

export function getStudyCollections(subjectSlug: string) {
  const directory = path.join(process.cwd(), "src/content/study-kits");
  if (!existsSync(directory)) return { collections: [], outdated: 0 };
  let outdated = 0;
  const collections = readdirSync(directory).filter((name) => name.endsWith(".json")).sort().flatMap((name) => {
    const kit = validateStudyKit(JSON.parse(readFileSync(path.join(directory, name), "utf8")));
    if (kit.subjectSlug !== subjectSlug) return [];
    const resource = getResourceById(kit.resourceId);
    if (!resource || resource.subjectSlug !== subjectSlug || name !== `${kit.resourceId}.json`) {
      throw new Error(`Riferimento risorsa non valido in study-kits/${name}.`);
    }
    const bytes = readFileSync(path.join(process.cwd(), "public", resource.fileUrl.slice(1)));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (kit.sourcePages.some((source) => source.page > resource.pageCount)) throw new Error(`Pagina fonte fuori dal PDF: ${name}.`);
    if (kit.sourceSha256 !== sha256 || kit.generatorVersion !== STUDY_VERSION || kit.model !== STUDY_MODEL) {
      outdated++;
      return [];
    }
    return [{ kit, resource }];
  });
  return { collections, outdated };
}
