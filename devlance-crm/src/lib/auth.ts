import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Lightweight stateless session: signed HMAC cookie containing
 * `{userId}.{expiresAt}.{signature}`. No DB session table required.
 * The signature binds userId + expiresAt so the cookie can't be tampered.
 */

const COOKIE_NAME = "devlance_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const ALGO = "sha256";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    // dev-only fallback — never rely on this in production
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production");
    }
    return "devlance-insecure-dev-secret";
  }
  return s;
}

function sign(userId: string, expiresAt: number): string {
  return createHmac(ALGO, secret())
    .update(`${userId}|${expiresAt}`)
    .digest("base64url");
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const sig = sign(userId, expiresAt);
  const value = `${userId}.${expiresAt}.${sig}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtStr, sig] = parts;
  const expiresAt = Number(expiresAtStr);
  if (!expiresAt || Number.isNaN(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  const expected = sign(userId, expiresAt);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return userId;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;