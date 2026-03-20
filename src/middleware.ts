import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Allow public routes: /login and /api/auth/*
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Require authentication for all protected routes
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Master routes require ADMIN, QA, or MANAGER role
  if (pathname.startsWith("/master")) {
    const role = token.role as string;
    if (!["ADMIN", "QA", "MANAGER"].includes(role)) {
      return NextResponse.redirect(new URL("/my-tests", req.url));
    }
  }

  // API routes (except /api/auth) require authentication — already checked above
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
