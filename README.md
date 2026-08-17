# 🚀 YouTube Watch-Time Accelerator

[![CI](https://github.com/Ankit-2910/yt-watchtime-accelerator/actions/workflows/ci.yml/badge.svg)](https://github.com/Ankit-2910/yt-watchtime-accelerator/actions/workflows/ci.yml)

**▶ Live demo: https://yt-watchtime-accelerator.vercel.app** (runs in Demo mode — synthetic data, no YouTube traffic)

A **legitimate** creator-growth command center. Its single mission: help a creator
reach **4,000 valid public watch hours** as fast as possible through **real**
audience discovery, retention, session depth and returning viewers.

> ### The non-negotiable principle
> This platform generates **only legitimate growth**. It has **no** view bots,
> watch-hour bots, fake viewers, purchased traffic, sub4sub, view exchanges,
> automated likes/comments/subscriptions, proxy/VPN rotation, click farms, or
> any technique to bypass YouTube detection or inflate metrics. Requests for any
> of those are **blocked in code** (`src/lib/safety.ts`) and explained back to
> the user. The 30-panel Video Lab analyzes metadata for QA/research — it never
> plays or automates engagement.

---

## ✨ What's built (runs today, zero setup)

The app boots straight into **Demo / Simulation mode** — fully synthetic data,
clearly labeled `SIMULATED DATA — NOT YOUTUBE TRAFFIC`, never sent to YouTube — so
every screen is explorable without keys or a database.

| Area | Status | Notes |
|------|--------|-------|
| **Command Center** dashboard | ✅ Full | "What should I do next?" Top-5, animated KPIs, 4,000-hour ring, charts, Channel Health Score |
| **Mission Control** | ✅ Full | Current/remaining, 7/30/90-day rates, growth rate, **Conservative/Realistic/Aggressive** projections, deadline planner, watch-time calculator |
| **Video Lab (30 panels)** | ✅ Full | 5×6 grid, **real** metadata via keyless YouTube oEmbed, QA/Research modes, per-panel load/remove/maximize/refresh/copy/open, error isolation, lazy thumbnails, localStorage persistence |
| **Analytics & Comparison** | ✅ Full | Rank + compare by any metric, superlatives (fastest-growing, highest retention/CTR, most watch hours/subs, most undervalued) |
| **Retention Intelligence** | ✅ Full | Per-video retention curve + auto-generated improvement plan (finds biggest drop-off) |
| **Title Lab** | ✅ Full | 5 categories × scored for CTR/SEO/curiosity/clarity/**misleading-risk** |
| **Thumbnail Lab** | ✅ Full | On-device canvas analysis → score/100 + 3 improvements (nothing uploaded) |
| **Playlist Intelligence** | ✅ Full | Recommended binge ordering to raise session depth |
| **Content Ideas** | ✅ Full | 30 grounded, ranked ideas with hook/audience/SEO/thumbnail/rationale |
| **Content Calendar** | ✅ Full | Kanban: IDEA→SCRIPT→RECORDING→EDITING→READY→PUBLISHED→ANALYZING |
| **Experiment Engine** | ✅ Full | A/B experiments on packaging only (never on views) |
| **External Promotion** | ✅ Full | Platform-specific distribution copy (FB/IG/WhatsApp/Telegram/Reddit/X/LinkedIn/Website/Blog/Email) with anti-spam notes |
| **NOVA — AI Strategist** | ✅ Full | Chat grounded in your channel summary; Gemini/OpenAI/Anthropic + rule-based fallback; guardrail-screened |
| **Reports** | ✅ Full | Daily/weekly/monthly deltas, top video, biggest opportunity, next action |
| **Settings + Monetization** | ✅ Full | Eligibility (1,000 subs + 4,000 valid hours), excluded-hours list, provider config, Connect/Disconnect YouTube |
| **YouTube OAuth (real data)** | ✅ Wired | Read-only OAuth → Data API + Analytics API assemble a real ChannelSnapshot; falls back to demo if not connected. Needs your Google credentials to activate (below). |
| **Postgres persistence** | ✅ Wired | Calendar + Experiments persist to Postgres when `DATABASE_URL` is set; transparently fall back to localStorage otherwise |
| PostgreSQL schema (Prisma) | ✅ Ships | All 16 requested tables, indexed |
| Docker + compose | ✅ Ships | App + Postgres |
| Test suite (Vitest) | ✅ Ships | Math, guardrails, URL parsing, engines, promotion (42 tests) |

### Connect your real YouTube channel (optional)
Read-only — the app never writes to YouTube or automates anything.
1. In [Google Cloud Console](https://console.cloud.google.com/): create OAuth credentials (Web application), enable **YouTube Data API v3** and **YouTube Analytics API**.
2. On the OAuth consent screen add scopes: `youtube.readonly` and `yt-analytics.readonly`.
3. Add redirect URI `http://localhost:3000/api/auth/youtube/callback`.
4. Put `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` and a long `AUTH_SECRET` in `.env.local`.
5. Restart, open **Settings → Connect YouTube**.

### Real per-second audience retention
When connected, the **Retention** tab fetches the true audience-retention curve
for the selected video from the Analytics API (`elapsedVideoTimeRatio` /
`audienceWatchRatio`, channel-owner auth) and derives the improvement plan from
it — including `relativeRetentionPerformance` vs similar-length videos. It's
fetched on demand per video and falls back to the modeled curve (from real avg %
viewed) when a video has too few views for a retention report.

### Still on the roadmap
- Impression-CTR / returning-viewer breakdowns (not exposed by the public Analytics API).
- Persisting ideas/thumbnail scores to Postgres (schema ready).

---

## 🧱 Tech stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript** (strict)
- **Tailwind CSS** (dark command-center theme)
- **Recharts** for charts
- **Prisma** + **PostgreSQL**
- **AI provider abstraction**: Gemini (default) · OpenAI · Anthropic · rule-based fallback
- **Vitest** for tests

---

## 🏃 Quick start

```bash
# 1. install
npm install

# 2. run the dev server (demo mode — no keys needed)
npm run dev
# open http://localhost:3000
```

That's it. Everything works in demo mode immediately.

### Optional configuration
Copy `.env.example` → `.env.local` and fill in only what you want:

```bash
cp .env.example .env.local
```

- `YOUTUBE_API_KEY` — unlocks view/like/comment counts in the Video Lab (metadata
  already works without it via oEmbed).
- `AI_PROVIDER` + `GEMINI_API_KEY` (or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`) —
  makes NOVA give tailored answers instead of rule-based ones.
- `DATABASE_URL` — only needed for the persistence/real-data mode.

---

## ✅ Verify (lint, types, tests)

```bash
npm run verify        # runs lint + typecheck + tests
# or individually:
npm run lint
npm run typecheck
npm run test
```

---

## 🐘 Database (optional)

```bash
# with DATABASE_URL set in .env
npm run db:generate   # prisma client
npm run db:push       # create tables
npm run db:studio     # browse data
```

Tables: `users, channels, videos, video_analytics, watch_time, subscribers,
playlists, playlist_videos, content_ideas, content_calendar, experiments,
thumbnails, titles, recommendations, alerts, daily_reports` — all indexed.

---

## 🐳 Docker

```bash
# app + postgres
docker compose up --build
# open http://localhost:3000
```

Pass secrets through your shell/`.env` (compose reads `GEMINI_API_KEY`,
`YOUTUBE_API_KEY`, `AI_PROVIDER`).

---

## ☁️ Deploy

### Vercel (recommended for the frontend/app)
1. Push this repo to GitHub.
2. Import into Vercel.
3. Add env vars (`AI_PROVIDER`, `GEMINI_API_KEY`, `YOUTUBE_API_KEY`, optionally
   `DATABASE_URL`).
4. Deploy. Demo mode works even with no env vars.

### Railway / Render / Docker host (for app + Postgres)
- Provision a PostgreSQL instance, set `DATABASE_URL`.
- Deploy the Docker image (`Dockerfile`) or use `docker compose`.
- Run `npm run db:push` once to create tables.

---

## 📁 Project structure

```
src/
  app/
    page.tsx                 # Command Center dashboard
    mission-control/         # roadmap, scenarios, calculator
    video-lab/               # 30-panel intelligence lab
    analytics/               # comparison engine + rankings
    retention/               # retention curves + plans
    title-lab/  thumbnail-lab/
    playlists/  ideas/  calendar/  experiments/
    strategist/              # NOVA chat
    reports/  settings/
    api/
      youtube/resolve/       # keyless oEmbed + optional Data API
      strategist/            # NOVA endpoint (guardrail-screened)
  components/                # Sidebar, KpiCard, ProgressRing, VideoPanel, Charts…
  lib/
    types.ts  watchtime.ts   # pure, tested domain math
    demo.ts                  # SIMULATED data generator (never sent to YouTube)
    youtube.ts  ai.ts        # service abstractions
    actions.ts  ideas.ts     # decision + content engines
    safety.ts                # legitimacy guardrails (enforced in code)
    store.tsx  format.ts
prisma/schema.prisma
```

---

## 🔒 Security notes
- API keys/secrets live only in server env; never shipped to the client
  (`youtube.ts`/`ai.ts` run in Node route handlers; the client imports only types).
- API routes validate input and return typed errors.
- NOVA prompts are screened for artificial-engagement requests before hitting any provider.
- Thumbnail analysis runs entirely on-device.

---

## ⚖️ A note on watch-time math
Watch-hour figures (e.g. `views × avg view duration`) are labeled **analytical
estimates**. Real watch time depends on retention, not raw view counts. The app
never manufactures hours — it helps you earn them.
