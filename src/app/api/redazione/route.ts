import { requireLocalEditor } from "@/lib/editor/guard";
import {
  loadDraft,
  publishDraft,
  renameTopic,
  reviewUnit,
} from "../../../../scripts/editor/repository.mts";
import {
  contributionPdf,
  listContributions,
  reviewContribution,
} from "@/lib/editor/contributions";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    requireLocalEditor(request);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new Error("Richiesta non valida.");
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Richiesta non valida.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const r = await reader.read();
        if (r.done) break;
        size += r.value.length;
        if (size > 32000) {
          await reader.cancel();
          throw new Error("Richiesta troppo grande.");
        }
        chunks.push(r.value);
      }
    } finally {
      reader.releaseLock();
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (body.action === "review")
      await reviewUnit(body.subject, body.id, body.decision, body.digest);
    else if (body.action === "reviewAll") {
      if (body.confirmed !== true || !Array.isArray(body.units))
        throw new Error("Conferma prima di aver controllato le bozze.");
      const draft = await loadDraft(body.subject);
      if (!draft || draft.stale || draft.source.sha256 !== body.sourceSha256)
        throw new Error("La fonte è cambiata: aggiorna la pagina.");
      for (const u of body.units)
        await reviewUnit(body.subject, u.id, "approved", u.digest);
    } else if (body.action === "rename")
      await renameTopic(body.subject, body.id, body.title);
    else if (body.action === "publish") {
      if (body.confirmed !== true)
        throw new Error("Conferma la revisione prima di pubblicare.");
      await publishDraft(body.subject, body.allowPartial === true);
    } else if (body.action === "listContributions")
      return Response.json(await listContributions(), { headers });
    else if (body.action === "reviewContribution")
      await reviewContribution(body.id, body.status, body.note);
    else if (body.action === "downloadContribution") {
      const pdf = await contributionPdf(body.id);
      return new Response(
        new Blob([pdf.bytes as BlobPart], { type: "application/pdf" }),
        {
          headers: {
            ...headers,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(pdf.name)}`,
          },
        },
      );
    } else throw new Error("Operazione non valida.");
    return Response.json({ ok: true }, { headers });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Operazione non riuscita.";
    const status =
      message === "EDITOR_NOT_FOUND"
        ? 404
        : message === "EDITOR_FORBIDDEN"
          ? 403
          : 400;
    return Response.json(
      {
        error:
          status === 404
            ? "Non trovato"
            : status === 403
              ? "Accesso non consentito"
              : message,
      },
      { status, headers },
    );
  }
}
