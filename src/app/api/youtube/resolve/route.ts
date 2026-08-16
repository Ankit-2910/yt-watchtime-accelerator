import { NextResponse } from "next/server";
import { resolveVideo } from "@/lib/youtube";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = (body.url ?? "").toString();
  if (!url.trim()) {
    return NextResponse.json({ error: "A YouTube URL or video ID is required." }, { status: 400 });
  }

  try {
    const video = await resolveVideo(url);
    if (!video) {
      return NextResponse.json(
        { error: "Not a recognizable YouTube URL, or the video is unavailable." },
        { status: 404 }
      );
    }
    return NextResponse.json({ video });
  } catch {
    return NextResponse.json({ error: "Failed to resolve video metadata." }, { status: 502 });
  }
}
