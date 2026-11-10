import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
const shared = globalThis as typeof globalThis & {
  __aulaLocalEditorToken?: string;
};
export function localHost(host: string | null) {
  return Boolean(host && /^(?:localhost|127\.0\.0\.1):\d{1,5}$/.test(host));
}
export function editorToken() {
  return (shared.__aulaLocalEditorToken ??= randomBytes(32).toString("hex"));
}
export function requireLocalEditor(request: Request) {
  if (
    process.env.NODE_ENV !== "development" ||
    !localHost(request.headers.get("host"))
  )
    throw new Error("EDITOR_NOT_FOUND");
  if (request.headers.get("origin") !== `http://${request.headers.get("host")}`)
    throw new Error("EDITOR_FORBIDDEN");
  const token = request.headers.get("x-aula-editor") ?? "",
    expected = editorToken();
  const given = Buffer.from(token),
    wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted))
    throw new Error("EDITOR_FORBIDDEN");
}
