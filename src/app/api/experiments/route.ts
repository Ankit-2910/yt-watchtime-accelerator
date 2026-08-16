import { NextResponse } from "next/server";
import { getPrisma, ensureDemoChannel } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shape(row: any) {
  return {
    id: row.id,
    dimension: row.dimension,
    hypothesis: row.hypothesis ?? "",
    metric: row.metric,
    variantA: row.variantA ?? "",
    variantB: row.variantB ?? "",
    status: row.status,
    winner: row.winner ?? "",
    confidence: row.confidence ?? undefined,
  };
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
  const rows = await c.prisma.experiment.findMany({
    where: { channelId: c.channelId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: rows.map(shape) });
}

export async function POST(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (!body.variantA || !body.variantB) {
    return NextResponse.json({ error: "variantA and variantB required" }, { status: 400 });
  }
  const row = await c.prisma.experiment.create({
    data: {
      channelId: c.channelId,
      dimension: body.dimension ?? "Title",
      hypothesis: body.hypothesis ?? "",
      metric: body.metric ?? "CTR",
      variantA: body.variantA,
      variantB: body.variantB,
      status: body.status ?? "planned",
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
  const row = await c.prisma.experiment.update({ where: { id }, data: patch });
  return NextResponse.json({ item: shape(row) });
}

export async function DELETE(req: Request) {
  const c = await ctx();
  if (!c) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await c.prisma.experiment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
