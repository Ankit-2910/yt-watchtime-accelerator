import { NextResponse } from "next/server";
import { getValidToken } from "@/lib/oauth";
import { fetchRetentionCurve } from "@/lib/ytdata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  const videoId = new URL(req.url).searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }
  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ connected: false, points: [] }, { status: 401 });
  }
  const { points, relative } = await fetchRetentionCurve(token, videoId);
  return NextResponse.json({ connected: true, points, relative });
}
