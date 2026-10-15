import { NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET;

function sign(payload: string) {
  if (!SECRET) {
    throw new Error("AUTH_SECRET is not defined");
  }
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

function verify(token: string) {
  if (!SECRET) return null;
  try {
    const [dataB64, sig] = token.split(".");
    if (!dataB64 || !sig) return null;
    const payload = Buffer.from(dataB64, "base64url").toString("utf8");
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const data = JSON.parse(payload);
    if (
      typeof data.iat !== "number" ||
      data.iat <= 0 ||
      Date.now() - data.iat > 7 * 24 * 60 * 60 * 1000 ||
      data.iat > Date.now() + 60_000
    ) {
      return null;
    }
    if (data.role !== "workshop" && data.role !== "marketer") return null;
    if (typeof data.name !== "string" || typeof data.phone !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    if (!SECRET) {
      return NextResponse.json({ error: "إعدادات الأمان غير مكتملة على الخادم" }, { status: 500 });
    }

    const body = await req.json();
    const { role, name, phone, license, city, spec, refCode, password } = body;

    if (role !== "workshop" && role !== "marketer") {
      return NextResponse.json({ error: "نوع الحساب غير صالح" }, { status: 400 });
    }

    if (
      typeof name !== "string" || !name.trim() ||
      typeof phone !== "string" || !phone.trim() ||
      typeof password !== "string" || password.length < 8
    ) {
      return NextResponse.json({ error: "يرجى إدخال كافة الحقول الأساسية وكلمة مرور من 8 أحرف على الأقل" }, { status: 400 });
    }

    if (role === "workshop" && (
      typeof license !== "string" || !license.trim() ||
      typeof city !== "string" || !city.trim()
    )) {
      return NextResponse.json({ error: "رقم السجل التجاري/الصناعي والمدينة مطلوبان للورشات" }, { status: 400 });
    }

    const sessionData = JSON.stringify({
      role,
      name: name.trim(),
      phone: phone.trim(),
      ...(role === "workshop" ? {
        license: license.trim(),
        city: city.trim(),
        spec: typeof spec === "string" ? spec : "",
        refCode: typeof refCode === "string" ? refCode : ""
      } : {}),
      iat: Date.now(),
    });

    const token = sign(sessionData);
    const res = NextResponse.json({ ok: true, role, name: name.trim() });

    res.cookies.set("euro_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "خطأ في خادم المصادقة" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/euro_session=([^;]+)/);
  if (!match) return NextResponse.json({ user: null });

  const user = verify(decodeURIComponent(match[1]));
  return NextResponse.json({ user });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("euro_session");
  return res;
}
