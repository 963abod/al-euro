import { NextRequest, NextResponse } from "next/server";

const SECRET =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production" ? "al-euro-local-dev-secret-change-me" : "");

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function validSession(token: string): Promise<{ role: "workshop" | "marketer" } | null> {
  try {
    if (!SECRET) return null;
    const parts = token.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const payloadBytes = decodeBase64Url(parts[0]);
    const signature = decodeBase64Url(parts[1]);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(new TextDecoder().decode(payloadBytes)));
    if (!isValid) return null;

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (
      (payload.role !== "workshop" && payload.role !== "marketer") ||
      typeof payload.name !== "string" ||
      typeof payload.phone !== "string" ||
      typeof payload.iat !== "number" ||
      Date.now() - payload.iat > 7 * 24 * 60 * 60 * 1000 ||
      payload.iat > Date.now() + 60_000
    ) return null;

    return { role: payload.role };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = req.cookies.get("euro_session")?.value;
  const session = token ? await validSession(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/workshop") && session.role !== "workshop") {
    return NextResponse.redirect(new URL("/marketer", req.url));
  }

  if (pathname.startsWith("/marketer") && session.role !== "marketer") {
    return NextResponse.redirect(new URL("/workshop", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workshop/:path*", "/marketer/:path*"]
};
