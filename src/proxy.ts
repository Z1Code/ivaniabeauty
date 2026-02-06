import { NextResponse, type NextRequest } from "next/server";

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get("__session");
  if (!sessionCookie?.value) return false;

  const verifyUrl = request.nextUrl.clone();
  verifyUrl.pathname = "/api/auth/verify";

  try {
    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const hasSession = await hasValidAdminSession(request);
    if (!hasSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  // If session is valid and user opens login, send to dashboard.
  if (pathname === "/admin/login") {
    const hasSession = await hasValidAdminSession(request);
    if (hasSession) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
