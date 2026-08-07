import { ADMIN_COOKIE } from "@/lib/admin-auth-constants";

export { ADMIN_COOKIE };

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): string | null {
  const fromEnv =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "";
  if (fromEnv) return fromEnv;
  // Never ship a known default secret in production.
  if (process.env.NODE_ENV === "production") return null;
  return "nestpaw-insecure-dev-secret";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword() && getSessionSecret());
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return toHex(digest);
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createAdminSessionToken() {
  const password = getAdminPassword();
  const secret = getSessionSecret();
  if (!password || !secret) {
    throw new Error("Admin auth is not configured");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const passwordHash = await sha256Hex(`${password}:${secret}`);
  const payload = `${issuedAt}.${passwordHash}`;
  const sig = await sha256Hex(`${payload}:${secret}`);
  return `${payload}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null,
) {
  if (!token || !getAdminPassword()) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issuedAtRaw, passwordHash, sig] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAt > SESSION_TTL_SECONDS) return false;

  const expectedPasswordHash = await sha256Hex(
    `${getAdminPassword()}:${secret}`,
  );
  const expectedSig = await sha256Hex(
    `${issuedAtRaw}.${passwordHash}:${secret}`,
  );

  return (
    timingSafeEqualString(passwordHash, expectedPasswordHash) &&
    timingSafeEqualString(sig, expectedSig)
  );
}

export function adminCookieOptions(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    // Must cover /admin UI and /api/admin APIs.
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
