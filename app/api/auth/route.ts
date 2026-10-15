"import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production" ? "al-euro-local-dev-secret-change-me" : "");

type Session = {
  role: "workshop" | "marketer";
  name: string;
  phone: string;
  license?: string;
  spec?: string;
  refCode?: string;
  iat: number;
};

function sign(payload: string) {
  if (!SECRET) throw new Error("AUTH_SECRET is not configured");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

function verify(token: string): Session | null {
  try {
    if (!SECRET) return null;
    const [dataB64, sig, extra] = token.split(".");
    if (!dataB64 || !sig || extra) return null;

    const expectedSig = createHmac("sha256", SECRET).update(
      Buffer.from(dataB64, "base64url").toString("utf8")
    ).digest();
    const receivedSig = Buffer.from(sig, "base64url");
    if (receivedSig.length !== expectedSig.length || !timingSafeEqual(receivedSig, expectedSig)) return null;

    const payload = JSON.parse(Buffer.from(dataB64, "base64url").toString("utf8")) as Session;
    if (
      (payload.role !== "workshop" && payload.role !== "marketer") ||
      typeof payload.name !== "string" ||
      typeof payload.phone !== "string" ||
      typeof payload.iat !== "number" ||
      Date.now() - payload.iat > 7 * 24 * 60 * 60 * 1000 ||
      payload.iat > Date.now() + 60_000
    ) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!SECRET) {
    return NextResponse.json({ error: "إعداد AUTH_SECRET مفقود على الخادم" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
  }

  const { role, name, phone, license, city, spec, refCode, password } = body;

  if (role !== "workshop" && role !== "marketer") {
    return NextResponse.json({ error: "نوع الحساب غير صالح" }, { status: 400 });
  }

  if (
    typeof name !== "string" || !name.trim() ||
    typeof phone !== "string" || !phone.trim() ||
    typeof password !== "string" || password.length < 8
  ) {
    return NextResponse.json({ error: "يرجى إدخال الاسم ورقم الهاتف وكلمة مرور من 8 أحرف على الأقل" }, { status: 400 });
  }

  if (role === "workshop" && (
    typeof license !== "string" || !license.trim() ||
    typeof city !== "string" || !city.trim()
  )) {
    return NextResponse.json({ error: "رقم السجل التجاري/الصناعي والمدينة مطلوبان للورشات" }, { status: 400 });
  }

  // هذه المرحلة تنشئ جلسة موقعة فقط؛ لا تتحقق من كلمة المرور ولا تنشئ حساباً في قاعدة بيانات.
  const sessionData = JSON.stringify({
    role,
    name: name.trim(),
    phone: phone.trim(),
    ...(role === "workshop" ? {
      license: String(license).trim(),
      city: String(city).trim(),
      spec: typeof spec === "string" ? spec : "",
      refCode: typeof refCode === "string" ? refCode : ""
    } : {}),
    iat: Date.now()
  });

  const token = sign(sessionData);
  const res = NextResponse.json({ ok: true, role, name: name.trim() });
  res.cookies.set("euro_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}

export async function GET(req: Request) {
  const token = req.headers.get("cookie")
    ?.split(";")
    .map(part => part.trim())
    .find(part => part.startsWith("euro_session="))
    ?.slice("euro_session=".length);

  const user = token ? verify(decodeURIComponent(token)) : null;
  return NextResponse.json({ user });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("euro_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return res;
}
