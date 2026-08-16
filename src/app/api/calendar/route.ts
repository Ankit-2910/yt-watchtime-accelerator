import { NextResponse } from "next/server";
import { getPrisma, ensureDemoChannel } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shape(row: any) {
  return { id: row.id, title: row.title, type: row.type, status: row.status };
}

async function ctx() {
  const prisma = await getPrisma();
  if (!prisma) return null;
  const channel = await ensureDemoChannel(prisma);
  if (!channel) return null;
  return { prisma, channelId: channel.id };
}

export async function GET() {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const rows = await c.prisma.calendarItem.findMany({
    where: { channelId: c.channelId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items: rows.map(shape) });
}

export async function POST(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const row = await c.prisma.calendarItem.create({
    data: {
      channelId: c.channelId,
      title: String(body.title),
      type: body.type ?? "long",
      status: body.status ?? "IDEA",
    },
  });
  return NextResponse.json({ item: shape(row) }, { status: 201 });
}

export async function PATCH(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id, ...patch } = body;
  const row = await c.prisma.calendarItem.update({
    where: { id },
    data: patch,
  });
  return NextResponse.json({ item: shape(row) });
}

export async function DELETE(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await c.prisma.calendarItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
