import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECRET = process.env.AUTH_SECRET;

type Session = {
  role: "workshop" | "marketer";
  name: string;
  phone: string;
  iat: number;
};

function base64UrlToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function verifySession(token?: string): Promise<Session | null> {
  if (!token || !SECRET) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const encoder = new TextEncoder();
    const payloadText = new TextDecoder().decode(base64UrlToUint8Array(parts[0]));
    const signature = base64UrlToUint8Array(parts[1]);
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(signature).buffer,
      encoder.encode(payloadText)
    );
    if (!valid) return null;

    const payload = JSON.parse(payloadText) as Partial<Session>;
    const now = Date.now();
    if (
      (payload.role !== "workshop" && payload.role !== "marketer") ||
      typeof payload.name !== "string" ||
      typeof payload.phone !== "string" ||
      typeof payload.iat !== "number" ||
      !Number.isFinite(payload.iat) ||
      payload.iat <= 0 ||
      payload.iat > now + 60_000 ||
      now - payload.iat > 30 * 24 * 60 * 60 * 1000
    ) return null;

    return {
      role: payload.role,
      name: payload.name,
      phone: payload.phone,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isLogin = pathname === "/login";
  const isProtectedPage =
    pathname === "/" ||
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/special" ||
    pathname.startsWith("/special/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/workshop" ||
    pathname.startsWith("/workshop/") ||
    pathname === "/marketer" ||
    pathname.startsWith("/marketer/");

  if (!isLogin && !isProtectedPage) return NextResponse.next();

  const session = await verifySession(req.cookies.get("euro_session")?.value);

  if (isLogin) {
    return session
      ? NextResponse.redirect(new URL("/account", req.url))
      : NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    (pathname === "/workshop" || pathname.startsWith("/workshop/")) &&
    session.role !== "workshop"
  ) {
    return NextResponse.redirect(new URL("/marketer", req.url));
  }

  if (
    (pathname === "/marketer" || pathname.startsWith("/marketer/")) &&
    session.role !== "marketer"
  ) {
    return NextResponse.redirect(new URL("/workshop", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/cart",
    "/cart/:path*",
    "/special",
    "/special/:path*",
    "/account",
    "/account/:path*",
    "/workshop",
    "/workshop/:path*",
    "/marketer",
    "/marketer/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
