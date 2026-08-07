import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = await verifyAdminSessionToken(token);

  // Login page handles its own redirect when the session is valid.
  if (pathname === "/admin/login") {
    if (valid) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!valid) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Drop forged / expired cookies so middleware stops treating them as present.
    response.cookies.set({
      name: ADMIN_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
