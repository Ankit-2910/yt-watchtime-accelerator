import { NextResponse } from "next/server";
import { askNova } from "@/lib/ai";
import { screenText } from "@/lib/safety";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { question?: string; summary?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = (body.question ?? "").toString().trim();
  if (!question) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }

  // Legitimacy guardrail — block requests to manufacture artificial engagement.
  const screen = screenText(question);
  if (!screen.allowed) {
    return NextResponse.json({ text: screen.reason, provider: "guardrail", blocked: true });
  }

  try {
    const { text, provider } = await askNova(question, { summary: body.summary });
    return NextResponse.json({ text, provider });
  } catch {
    return NextResponse.json({ error: "NOVA failed to respond. Try again." }, { status: 502 });
  }
}
