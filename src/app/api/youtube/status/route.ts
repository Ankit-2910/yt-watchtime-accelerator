import { NextResponse } from "next/server";
import { oauthConfigured, readSession } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = readSession();
  return NextResponse.json({
    configured: oauthConfigured(),
    connected: Boolean(session),
    channelTitle: session?.channelTitle ?? null,
  });
}
