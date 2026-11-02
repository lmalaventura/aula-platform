import { after } from "next/server";
import { handleStudyGeneration } from "@/lib/study/web-server";

export const runtime = "nodejs";
export const maxDuration = 300;

export function POST(request: Request) {
  return handleStudyGeneration(request, (work) => after(work));
}
