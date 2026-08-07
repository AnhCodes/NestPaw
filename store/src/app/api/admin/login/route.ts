import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  adminCookieOptions,
  createAdminSessionToken,
  getAdminPassword,
  isAdminConfigured,
} from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit({
    key: `admin-login:${ip}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, {
      status: 303,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured" },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const nextRaw = String(form.get("next") ?? "/admin");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";

  const expected = getAdminPassword();
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);

  if (!ok) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.redirect(new URL(next, request.url), {
    status: 303,
  });
  response.cookies.set(adminCookieOptions(token));
  return response;
}
