import { NextResponse } from "next/server";
import { exchangeCode, saveSession, verifyState, type YtSession } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return NextResponse.redirect(`${origin}/settings?yt=denied`);
  if (!code || !state || !verifyState(state)) {
    return NextResponse.redirect(`${origin}/settings?yt=bad_state`);
  }

  try {
    const session: YtSession = await exchangeCode(code);

    // Fetch the channel name so status can display it.
    try {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        const ch = data.items?.[0];
        session.channelId = ch?.id;
        session.channelTitle = ch?.snippet?.title;
      }
    } catch {
      /* non-fatal — session still valid */
    }

    saveSession(session);
    return NextResponse.redirect(`${origin}/?connected=1`);
  } catch {
    return NextResponse.redirect(`${origin}/settings?yt=exchange_failed`);
  }
}
