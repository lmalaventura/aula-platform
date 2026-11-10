export function POST() {
  return Response.json({ error: "generation_moved_to_editor" }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
