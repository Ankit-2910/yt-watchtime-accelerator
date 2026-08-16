// Prisma client accessor with graceful degradation.
//
// The app is demo-first and must boot with no database. So we:
//   - return null when DATABASE_URL is unset (callers fall back to localStorage),
//   - lazily import @prisma/client so a missing/ungenerated client never crashes
//     the app at import time,
//   - cache a single client on globalThis (avoids connection storms in dev).
//
// Typed loosely (`any`) on purpose: the generated Prisma types may not exist in
// every environment (client not generated), and tsconfig `skipLibCheck` keeps
// this safe. Run `npm run db:generate` for a fully typed, runnable DB mode.

let clientPromise: Promise<any | null> | null = null;

export async function getPrisma(): Promise<any | null> {
  if (!process.env.DATABASE_URL) return null;
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    try {
      const mod: any = await import("@prisma/client");
      const g = globalThis as any;
      if (!g.__ytwtaPrisma) g.__ytwtaPrisma = new mod.PrismaClient();
      return g.__ytwtaPrisma;
    } catch {
      return null;
    }
  })();

  return clientPromise;
}

/**
 * Ensure a demo User + Channel exist so editable collections (calendar,
 * experiments) have a valid FK to attach to. Returns the channel row or null.
 */
export async function ensureDemoChannel(prisma: any): Promise<any | null> {
  try {
    const user = await prisma.user.upsert({
      where: { email: "demo@ytwta.local" },
      update: {},
      create: { email: "demo@ytwta.local", name: "Demo User" },
    });
    const channel = await prisma.channel.upsert({
      where: { ytChannelId: "demo-channel" },
      update: {},
      create: {
        userId: user.id,
        ytChannelId: "demo-channel",
        title: "Chronicle Lab (Demo)",
      },
    });
    return channel;
  } catch {
    return null;
  }
}
