// Google / YouTube OAuth 2.0 — server-only.
//
// Read-only access to the creator's OWN channel + analytics. This is used to
// pull *legitimate* private metrics (valid watch hours, retention, subscribers)
// so the dashboard reflects real data. It never writes to YouTube or automates
// anything. Tokens are stored in a signed, httpOnly cookie (no DB required).

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ytwta_yt_session";
const STATE_COOKIE = "ytwta_oauth_state";

export const YT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export interface YtSession {
  accessToken: string;
  refreshToken?: string;
  /** epoch ms when the access token expires */
  expiresAt: number;
  channelId?: string;
  channelTitle?: string;
}

export function oauthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
}

function secret(): string {
  return process.env.AUTH_SECRET || "insecure-dev-secret-change-me";
}

function sign(payload: string): string {
  const mac = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

function unsign(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  // constant-time compare
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return payload;
}

function encode(obj: unknown): string {
  return sign(Buffer.from(JSON.stringify(obj)).toString("base64url"));
}

function decode<T>(token: string): T | null {
  const payload = unsign(token);
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export function redirectUri(): string {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/youtube/callback`
  );
}

/** Build the Google consent URL and stash a CSRF state cookie. */
export function buildAuthUrl(): string {
  const state = crypto.randomBytes(16).toString("hex");
  cookies().set(STATE_COOKIE, sign(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    scope: YT_SCOPES.join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function verifyState(state: string): boolean {
  const cookie = cookies().get(STATE_COOKIE)?.value;
  if (!cookie) return false;
  const value = unsign(cookie);
  cookies().delete(STATE_COOKIE);
  return value === state;
}

export async function exchangeCode(code: string): Promise<YtSession> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

async function refresh(session: YtSession): Promise<YtSession> {
  if (!session.refreshToken) return session;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: session.refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`);
  const data = await res.json();
  const next: YtSession = {
    ...session,
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  saveSession(next);
  return next;
}

export function saveSession(session: YtSession): void {
  cookies().set(SESSION_COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function readSession(): YtSession | null {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  return decode<YtSession>(cookie);
}

export function clearSession(): void {
  cookies().delete(SESSION_COOKIE);
}

/** Return a valid access token, refreshing if it is within 60s of expiry. */
export async function getValidToken(): Promise<string | null> {
  let session = readSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() < 60_000 && session.refreshToken) {
    try {
      session = await refresh(session);
    } catch {
      return null;
    }
  }
  return session.accessToken;
}
