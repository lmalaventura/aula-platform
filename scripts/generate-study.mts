import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCloudflareGenerator, type StudyGenerator } from "./study/cloudflare.mts";
import { extractSourcePages } from "./study/pdf.mts";
import { createStudyKit, generationFingerprint, readCachedKit, saveStudyKit, type RejectedDraft } from "./study/generate.mts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--dry-run", "--force"].includes(arg))) {
    throw new Error("Opzioni disponibili: --dry-run (solo estrazione) e --force (rigenera anche i risultati aggiornati).");
  }
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const resources: { id: string; subjectSlug: string; title: string; fileUrl: string; byteSize: number; pageCount: number }[] = JSON.parse(await readFile(path.join(root, "src/content/resources.json"), "utf8"));
  const subjects: { slug: string; title: string }[] = JSON.parse(await readFile(path.join(root, "src/content/subjects.json"), "utf8"));
  let generate: StudyGenerator | undefined;
  console.log(dryRun ? "Solo estrazione: nessun testo inviato al servizio AI." : "Generazione: verranno inviate a Cloudflare al massimo quattro pagine testuali per ogni PDF da aggiornare.");
  for (const resource of resources) {
    if (!/^\/materials\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(resource.fileUrl) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(resource.id)) throw new Error("Metadati risorsa non validi.");
    const subject = subjects.find((entry) => entry.slug === resource.subjectSlug);
    if (!subject) throw new Error(`Materia mancante per ${resource.id}.`);
    const pdfPath = path.join(root, "public", resource.fileUrl.slice(1));
    const extracted = await extractSourcePages(pdfPath);
    if (extracted.pageCount !== resource.pageCount || (await readFile(pdfPath)).length !== resource.byteSize) throw new Error(`PDF diverso dai metadati: ${resource.id}.`);
    const source = { resourceId: resource.id, subjectSlug: subject.slug, sourceTitle: resource.title, subjectTitle: subject.title, sourceSha256: extracted.sourceSha256, sourcePages: extracted.sourcePages };
    const pages = source.sourcePages.map((entry) => entry.page).join(", ");
    console.log(`${subject.title}: pagine fisiche PDF ${pages}; ${source.sourcePages.reduce((sum, entry) => sum + entry.text.length, 0)} caratteri.`);
    if (dryRun) continue;
    const outputPath = path.join(root, "src/content/study-kits", `${resource.id}.json`);
    if (!force && await readCachedKit(outputPath, generationFingerprint(source))) {
      console.log("  Gia aggiornato: nessuna chiamata AI.");
      continue;
    }
    generate ??= createCloudflareGenerator();
    console.log("  Generazione in corso (fino a due minuti per richiesta)...");
    const failures: RejectedDraft[] = [];
    const kit = await createStudyKit(source, generate, async (failure) => {
      failures.push(failure);
      const directory = path.join(root, ".aula/diagnostics");
      await mkdir(directory, { recursive: true });
      const report = { createdAt: new Date().toISOString(), resourceId: source.resourceId, sourceSha256: source.sourceSha256, sourcePages: source.sourcePages, failures };
      await writeFile(path.join(directory, `${resource.id}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
      console.log(`  Risposta rifiutata: rapporto locale in .aula/diagnostics/${resource.id}.json (nessuna credenziale).`);
    });
    await saveStudyKit(outputPath, kit);
    console.log(`  Salvate ${kit.flashcards.length} flashcard e ${kit.quiz.length} domande. Citazioni letterali controllate; correttezza disciplinare non certificata.`);
  }
  console.log(dryRun ? "Estrazione completata. Puoi procedere con study:generate." : "Operazione completata. Avvia o riavvia npm run dev e apri una materia > Studia e ripassa.");
}

main().catch((error) => {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") console.error("Tempo di attesa terminato. I file precedentemente salvati rimangono disponibili; riprova piu tardi.");
  else if (error instanceof TypeError && error.message === "fetch failed") console.error("Connessione a Cloudflare non riuscita. Controlla Internet o proxy; nessuna chiave viene stampata.");
  else console.error(error instanceof Error ? error.message : "Generazione non riuscita.");
  process.exitCode = 1;
});
