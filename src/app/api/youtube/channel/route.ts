import { NextResponse } from "next/server";
import { getValidToken } from "@/lib/oauth";
import { buildRealChannel } from "@/lib/ytdata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }
  try {
    const channel = await buildRealChannel(token);
    return NextResponse.json({ connected: true, channel });
  } catch (err) {
    return NextResponse.json(
      {
        connected: true,
        error:
          err instanceof Error ? err.message : "Failed to load channel analytics.",
      },
      { status: 502 }
    );
  }
}
