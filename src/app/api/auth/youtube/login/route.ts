import { NextResponse } from "next/server";
import { buildAuthUrl, oauthConfigured } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!oauthConfigured()) {
    return NextResponse.redirect(`${origin}/settings?yt=not_configured`);
  }
  return NextResponse.redirect(buildAuthUrl());
}
