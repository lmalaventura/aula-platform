import subjectsData from "@/content/subjects.json";
import type { Subject } from "./types";

const subjects: readonly Subject[] = subjectsData;
const knownSlugs = new Set<string>();

for (const subject of subjects) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subject.slug)) {
    throw new Error(`Slug non valido nel catalogo: "${subject.slug}".`);
  }

  if (knownSlugs.has(subject.slug)) {
    throw new Error(`Slug duplicato nel catalogo: "${subject.slug}".`);
  }

  knownSlugs.add(subject.slug);
}

export function getSubjects(): readonly Subject[] {
  return subjects;
}

export function getSubjectBySlug(slug: string): Subject | undefined {
  return subjects.find((subject) => subject.slug === slug);
}