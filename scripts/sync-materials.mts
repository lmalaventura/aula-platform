import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { atomicJson, projectRoot } from "./editor/repository.mts";
const file = path.join(projectRoot, "src/content/resources.json");
const resources = JSON.parse(await readFile(file, "utf8")) as {
  fileUrl: string;
  byteSize: number;
  pageCount: number;
}[];
for (const resource of resources) {
  if (!/^\/materials\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(resource.fileUrl))
    throw new Error("Percorso materiale non valido.");
  const bytes = await readFile(
    path.join(projectRoot, "public", resource.fileUrl.slice(1)),
  );
  const task = getDocument({ data: new Uint8Array(bytes), verbosity: 0 });
  try {
    const doc = await task.promise;
    resource.byteSize = bytes.length;
    resource.pageCount = doc.numPages;
  } finally {
    await task.destroy();
  }
}
await atomicJson(file, resources);
console.log(
  "Dimensioni e numero di pagine aggiornati. I contenuti approvati su versioni precedenti non verranno presentati come aggiornati.",
);
