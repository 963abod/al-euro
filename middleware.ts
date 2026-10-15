import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECRET =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "al-euro-local-dev-secret-change-me"
    : "");

type Session = {
  role: "workshop" | "marketer";
  name: string;
  phone: string;
  iat: number;
};

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function verifySession(token?: string): Promise<Session | null> {
  if (!token || !SECRET) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const encoder = new TextEncoder();
    const payloadBytes = base64UrlToUint8Array(parts[0]);
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const signatureBytes = base64UrlToUint8Array(parts[1]);

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(payloadStr)
    );

    if (!isValid) return null;

    const payload = JSON.parse(payloadStr) as Partial<Session>;
    const now = Date.now();

    if (
      (payload.role !== "workshop" && payload.role !== "marketer") ||
      typeof payload.name !== "string" ||
      typeof payload.phone !== "string" ||
      typeof payload.iat !== "number" ||
      !Number.isFinite(payload.iat) ||
      now - payload.iat > 7 * 24 * 60 * 60 * 1000 ||
      payload.iat > now + 60_000
    ) {
      return null;
    }

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

  // منع الوصول إلى أي مسار إدارة قديم.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/workshop/") || pathname === "/workshop" ||
      pathname.startsWith("/marketer/") || pathname === "/marketer") {
    const token = req.cookies.get("euro_session")?.value;
    const session = await verifySession(token);

    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if ((pathname === "/workshop" || pathname.startsWith("/workshop/")) &&
        session.role !== "workshop") {
      return NextResponse.redirect(new URL("/marketer", req.url));
    }

    if ((pathname === "/marketer" || pathname.startsWith("/marketer/")) &&
        session.role !== "marketer") {
      return NextResponse.redirect(new URL("/workshop", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workshop", "/workshop/:path*", "/marketer", "/marketer/:path*", "/admin", "/admin/:path*"],
};
