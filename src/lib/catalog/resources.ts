import { statSync } from "node:fs";
import path from "node:path";
import categoriesData from "@/content/categories.json";
import resourcesData from "@/content/resources.json";
import { getSubjectBySlug } from "@/lib/catalog";
import type { ResourceCategory, StudyResource } from "./resource-types";

const categories: readonly ResourceCategory[] = categoriesData;
const resources: readonly StudyResource[] = resourcesData;
const categoryIds = new Set<string>();
const resourceIds = new Set<string>();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

for (const category of categories) {
  if (!slugPattern.test(category.id) || categoryIds.has(category.id)) {
    throw new Error(`Categoria non valida o duplicata: ${category.id}`);
  }
  categoryIds.add(category.id);
}

for (const resource of resources) {
  if (!slugPattern.test(resource.id) || resourceIds.has(resource.id)) {
    throw new Error(`ID risorsa non valido o duplicato: ${resource.id}`);
  }
  resourceIds.add(resource.id);

  if (!getSubjectBySlug(resource.subjectSlug)) {
    throw new Error(`Materia inesistente per la risorsa: ${resource.id}`);
  }
  if (!categoryIds.has(resource.categoryId)) {
    throw new Error(`Categoria inesistente per la risorsa: ${resource.id}`);
  }
  if (!Number.isInteger(resource.pageCount) || resource.pageCount < 1) {
    throw new Error(`Numero di pagine non valido: ${resource.id}`);
  }
  if (!/^\/materials\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(resource.fileUrl)) {
    throw new Error(`Percorso PDF non valido: ${resource.id}`);
  }

  const filePath = path.join(process.cwd(), "public", resource.fileUrl.slice(1));
  let size: number;
  try {
    const file = statSync(filePath);
    if (!file.isFile()) throw new Error("Non è un file");
    size = file.size;
  } catch {
    throw new Error(`PDF mancante o non leggibile: public${resource.fileUrl}`);
  }
  if (size !== resource.byteSize) {
    throw new Error(`Dimensione PDF diversa dai metadati: ${resource.id}`);
  }
}

export function getResourceCategories(): readonly ResourceCategory[] {
  return categories;
}

export function getResources(): readonly StudyResource[] {
  return resources;
}

export function getResourcesForSubject(slug: string): readonly StudyResource[] {
  return resources.filter((resource) => resource.subjectSlug === slug);
}

export function getResourceById(id: string): StudyResource | undefined {
  return resources.find((resource) => resource.id === id);
}
