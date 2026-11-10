import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import assignments from "@/content/study-sources.json";
import { getResourceById } from "@/lib/catalog/resources";
import { validateBank } from "./bank";

export function getCanonicalResource(subjectSlug: string) {
  const assigned = assignments.filter((s) => s.subjectSlug === subjectSlug);
  if (assigned.length > 1)
    throw new Error(`Più fonti principali per ${subjectSlug}.`);
  const resource = assigned[0]
    ? getResourceById(assigned[0].resourceId)
    : undefined;
  if (resource && resource.subjectSlug !== subjectSlug)
    throw new Error("Fonte principale assegnata a una materia diversa.");
  return resource;
}
export function getPublishedBank(subjectSlug: string) {
  const resource = getCanonicalResource(subjectSlug);
  if (!resource) return { bank: null, outdated: false };
  const file = path.join(
    process.cwd(),
    "src/content/study-banks",
    subjectSlug + ".json",
  );
  if (!existsSync(file)) return { bank: null, outdated: false };
  const bank = validateBank(JSON.parse(readFileSync(file, "utf8")));
  if (
    bank.subjectSlug !== subjectSlug ||
    bank.sourceId !== resource.id ||
    bank.sourceUrl !== resource.fileUrl
  )
    throw new Error("Banca di studio collegata alla fonte sbagliata.");
  const bytes = readFileSync(
    path.join(process.cwd(), "public", resource.fileUrl.slice(1)),
  );
  const current = createHash("sha256").update(bytes).digest("hex");
  return current === bank.sourceSha256
    ? { bank, outdated: false }
    : { bank: null, outdated: true };
}
