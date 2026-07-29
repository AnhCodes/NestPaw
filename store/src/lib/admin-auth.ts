import { createHash, timingSafeEqual } from "crypto";
import { ADMIN_COOKIE } from "@/lib/admin-auth-constants";

export { ADMIN_COOKIE };
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "nestpaw-insecure-dev-secret"
  );
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword());
}

export function createAdminSessionToken() {
  const password = getAdminPassword();
  const secret = getSessionSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${issuedAt}.${createHash("sha256")
    .update(`${password}:${secret}`)
    .digest("hex")}`;
  const sig = createHash("sha256")
    .update(`${payload}:${secret}`)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token || !getAdminPassword()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issuedAtRaw, passwordHash, sig] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAt > SESSION_TTL_SECONDS) return false;

  const secret = getSessionSecret();
  const expectedPasswordHash = createHash("sha256")
    .update(`${getAdminPassword()}:${secret}`)
    .digest("hex");
  const expectedSig = createHash("sha256")
    .update(`${issuedAtRaw}.${passwordHash}:${secret}`)
    .digest("hex");

  try {
    const a = Buffer.from(passwordHash);
    const b = Buffer.from(expectedPasswordHash);
    const c = Buffer.from(sig);
    const d = Buffer.from(expectedSig);
    if (a.length !== b.length || c.length !== d.length) return false;
    return timingSafeEqual(a, b) && timingSafeEqual(c, d);
  } catch {
    return false;
  }
}

export function adminCookieOptions(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
