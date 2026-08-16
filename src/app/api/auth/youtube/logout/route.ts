import { NextResponse } from "next/server";
import { clearSession } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  clearSession();
  return NextResponse.redirect(`${new URL(req.url).origin}/settings?yt=disconnected`);
}
