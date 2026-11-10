import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "node_modules/pdfjs-dist");
const { version } = JSON.parse(
  await readFile(resolve(source, "package.json"), "utf8"),
);
if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version))
  throw new Error("Versione PDF.js non riconosciuta");
const target = resolve(root, "public/vendor/pdfjs", version);
await mkdir(target, { recursive: true });
await cp(
  resolve(source, "build/pdf.worker.min.mjs"),
  resolve(target, "pdf.worker.min.mjs"),
);
for (const folder of ["cmaps", "standard_fonts", "wasm"]) {
  await cp(resolve(source, folder), resolve(target, folder), {
    recursive: true,
  });
}
await cp(resolve(source, "LICENSE"), resolve(target, "LICENSE"));
await writeFile(resolve(target, "version.json"), JSON.stringify({ version }));
console.log("Lettore PDF: risorse locali pronte (" + version + ").");
