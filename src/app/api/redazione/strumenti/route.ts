import { requireLocalEditor } from "@/lib/editor/guard";
import { AUDIO_LIMIT } from "@/lib/learning-tools/schema";
import {
  audioBytes,
  demoAudio,
  publishTool,
  readDraft,
  saveTool,
  withdrawTool,
} from "../../../../../scripts/learning-tools/repository.mts";
export const runtime = "nodejs";
const responseHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
async function boundedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Richiesta vuota.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Richiesta troppo grande.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function POST(request: Request) {
  try {
    requireLocalEditor(request);
    const type = request.headers.get("content-type") ?? "";
    if (type.startsWith("multipart/form-data")) {
      const bytes = await boundedBody(request, AUDIO_LIMIT + 200000);
      const form = await new Response(bytes, {
        headers: { "Content-Type": type },
      }).formData();
      const data = form.get("data");
      if (typeof data !== "string" || data.length > 180000)
        throw new Error("Dati dello strumento non validi.");
      const body = JSON.parse(data),
        audio = form.get("audio");
      let file;
      if (audio instanceof File && audio.size) {
        if (audio.size > AUDIO_LIMIT)
          throw new Error("Audio troppo grande: massimo 10 MB.");
        file = {
          bytes: new Uint8Array(await audio.arrayBuffer()),
          ext: audio.name.split(".").pop()?.toLowerCase() ?? "",
        };
      }
      const draft = await saveTool(
        body.subject,
        body.input,
        body.sourceSha256,
        { id: body.id, expectedDigest: body.digest, audio: file },
      );
      return Response.json(draft, { headers: responseHeaders });
    }
    if (!type.startsWith("application/json"))
      throw new Error("Formato richiesta non valido.");
    const body = JSON.parse(
      (await boundedBody(request, 16000)).toString("utf8"),
    );
    if (body.action === "demoAudio")
      return new Response(demoAudio(), {
        headers: { ...responseHeaders, "Content-Type": "audio/wav" },
      });
    if (body.action === "audio") {
      const tool = await readDraft(body.subject, body.id);
      return new Response(await audioBytes(tool), {
        headers: {
          ...responseHeaders,
          "Content-Type":
            tool.audio?.ext === "wav" ? "audio/wav" : "audio/mpeg",
        },
      });
    }
    if (body.action === "publish")
      return Response.json(
        await publishTool(
          body.subject,
          body.id,
          body.digest,
          body.confirmed === true,
        ),
        { headers: responseHeaders },
      );
    if (body.action === "withdraw")
      return Response.json(
        await withdrawTool(body.subject, body.id, body.digest),
        { headers: responseHeaders },
      );
    throw new Error("Operazione non riconosciuta.");
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
      { status, headers: responseHeaders },
    );
  }
}
