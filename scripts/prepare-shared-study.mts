import { prepareDraft } from "./editor/repository.mts";
import { createCloudflareGenerator } from "./study/cloudflare.mts";
const args = process.argv.slice(2);
const subject = args[args.indexOf("--subject") + 1];
const limitArg = args.indexOf("--max-units"),
  limit = limitArg >= 0 ? Number(args[limitArg + 1]) : 100;
if (
  !args.includes("--subject") ||
  !subject ||
  !Number.isSafeInteger(limit) ||
  limit < 1 ||
  limit > 100
)
  throw new Error(
    "Uso: npm.cmd run study:prepare -- --subject machine-learning [--dry-run] [--max-units 1..100] [--force]",
  );
let generate: ReturnType<typeof createCloudflareGenerator> | undefined;
console.log(
  args.includes("--dry-run")
    ? "Solo analisi del PDF: nessun invio all’AI."
    : `Preparazione editoriale: fino a ${limit} nuove raccolte, massimo due risposte AI ciascuna. Le pagine del PDF vengono inviate a Cloudflare; cache e bozze restano in .aula/editor.`,
);
try {
  const draft = await prepareDraft(
    subject,
    (input) => {
      generate ??= createCloudflareGenerator();
      return generate(input);
    },
    {
      dryRun: args.includes("--dry-run"),
      maxUnits: limit,
      force: args.includes("--force"),
      onProgress: console.log,
    },
  );
  console.log(
    `${draft.topics.length} macroargomenti; ${draft.units.length} parti; ${draft.units.filter((u) => u.state === "ready").length} raccolte pronte. Revisione: avvia npm.cmd run dev e apri http://localhost:3000/redazione.`,
  );
} catch (e) {
  console.error(
    e instanceof Error
      ? e.message
      : "Preparazione interrotta. Risultati precedenti conservati.",
  );
  process.exitCode = 1;
}
