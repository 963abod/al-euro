import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

const COOKIE_NAME = "euro_session";
const SESSION_AGE = 60 * 60 * 24 * 30;

type Session = {
  id: string;
  role: "workshop" | "marketer";
  name: string;
  phone: string;
  my_ref_code?: string | null;
  iat: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not defined in environment variables");
  return secret;
}

function sign(payload: Session): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verify(token: string): Session | null {
  try {
    const [data, signature, extra] = token.split(".");
    if (!data || !signature || extra) return null;
    const expected = crypto.createHmac("sha256", getSecret()).update(data).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

    const session = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Partial<Session>;
    const now = Date.now();
    if (
      typeof session.id !== "string" ||
      (session.role !== "workshop" && session.role !== "marketer") ||
      typeof session.name !== "string" ||
      typeof session.phone !== "string" ||
      typeof session.iat !== "number" ||
      !Number.isFinite(session.iat) ||
      session.iat <= 0 ||
      session.iat > now + 60_000 ||
      now - session.iat > SESSION_AGE * 1000
    ) return null;

    return session as Session;
  } catch {
    return null;
  }
}

function setSession(session: Omit<Session, "iat">) {
  const token = sign({ ...session, iat: Date.now() });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_AGE,
  });
}

const USER_FIELDS = "id, role, name, phone, city, license, specs, tier, debt_limit, debt_balance, cashback_balance, my_ref_code, is_active, created_at";

export async function GET() {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ user: null });

    const session = verify(token);
    if (!session) {
      cookies().delete(COOKIE_NAME);
      return NextResponse.json({ user: null });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select(USER_FIELDS)
      .eq("id", session.id)
      .single();

    if (error || !user || !user.is_active) {
      cookies().delete(COOKIE_NAME);
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode = "login", role, name, phone, password, license, city, spec, refCode } = body;

    if (!["login", "register"].includes(mode) || !["workshop", "marketer"].includes(role)) {
      return NextResponse.json({ error: "نوع العملية أو الحساب غير صالح" }, { status: 400 });
    }
    if (!phone || !password || String(password).length < 4) {
      return NextResponse.json({ error: "يرجى إدخال رقم الموبايل وكلمة مرور من 4 أحرف على الأقل" }, { status: 400 });
    }

    const cleanPhone = String(phone).trim();
    const passHash = crypto.createHmac("sha256", getSecret()).update(String(password)).digest("hex");
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from("users").select("*").eq("phone", cleanPhone).eq("role", role).maybeSingle();

    if (findError) return NextResponse.json({ error: "خطأ في الاتصال بقاعدة البيانات" }, { status: 500 });

    if (mode === "login") {
      if (!existingUser) return NextResponse.json({ error: "لا يوجد حساب مسجل بهذا الرقم ونوع الحساب." }, { status: 404 });
      if (existingUser.password_hash !== passHash) return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
      if (!existingUser.is_active) {
        return NextResponse.json({
          pendingApproval: true,
          error: "حسابك قيد المراجعة من قِبل الإدارة، وسيتم تفعيله بعد التحقق من البيانات.",
        }, { status: 403 });
      }

      setSession({
        id: String(existingUser.id),
        role: existingUser.role,
        name: existingUser.name,
        phone: existingUser.phone,
        my_ref_code: existingUser.my_ref_code,
      });
      return NextResponse.json({ ok: true, user: existingUser });
    }

    if (existingUser) return NextResponse.json({ error: "هذا الرقم مسجل مسبقاً بنفس نوع الحساب." }, { status: 400 });
    if (!name || !String(name).trim()) return NextResponse.json({ error: "الاسم مطلوب لإنشاء الحساب" }, { status: 400 });
    if (role === "workshop" && (!license || !city || !spec)) {
      return NextResponse.json({ error: "يرجى إدخال رقم الترخيص والمدينة واختصاص الماركات للورشة" }, { status: 400 });
    }

    const specsArray = spec
      ? String(spec).split(/[,،]/).map((s: string) => s.trim()).filter(Boolean)
      : [];

    let newUser: any = null;
    let insertError: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const generatedRefCode = role === "marketer"
        ? `MK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
        : null;

      const result = await supabaseAdmin.from("users").insert({
        role,
        name: String(name).trim(),
        phone: cleanPhone,
        password_hash: passHash,
        license: role === "workshop" ? String(license).trim() : null,
        city: city ? String(city).trim() : null,
        specs: specsArray,
        my_ref_code: generatedRefCode,
        referred_by_code: role === "workshop" && refCode ? String(refCode).trim() : null,
        is_active: role !== "workshop",
      }).select("*").single();

      if (!result.error) {
        newUser = result.data;
        insertError = null;
        break;
      }
      insertError = result.error;
      if (!(result.error.code === "23505" && result.error.message?.includes("my_ref_code"))) break;
    }

    if (insertError || !newUser) {
      if (insertError?.code === "23505") return NextResponse.json({ error: "هذا الرقم مسجل مسبقاً أو تعذر إنشاء كود فريد." }, { status: 400 });
      return NextResponse.json({ error: insertError?.message || "تعذر إنشاء الحساب" }, { status: 500 });
    }

    if (role === "workshop") {
      return NextResponse.json({
        ok: true,
        pendingApproval: true,
        message: "تم إرسال طلب تسجيل الورشة للإدارة. سيتم تفعيل الحساب بعد مراجعة البيانات.",
      });
    }

    setSession({
      id: String(newUser.id),
      role: newUser.role,
      name: newUser.name,
      phone: newUser.phone,
      my_ref_code: newUser.my_ref_code,
    });
    return NextResponse.json({ ok: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "حدث خطأ غير متوقع في الخادم" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "يرجى تسجيل الدخول أولاً" }, { status: 401 });
    const session = verify(token);
    if (!session) {
      cookies().delete(COOKIE_NAME);
      return NextResponse.json({ error: "الجلسة غير صالحة، سجّل الدخول مجدداً" }, { status: 401 });
    }

    const body = await req.json();
    const updates: Record<string, string> = {};
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "الاسم يجب أن يكون بين حرفين و100 حرف" }, { status: 400 });
      updates.name = name;
    }
    if (typeof body.city === "string") {
      const city = body.city.trim();
      if (city.length > 80) return NextResponse.json({ error: "اسم المحافظة طويل جداً" }, { status: 400 });
      if (city) updates.city = city;
    }
    if (typeof body.newPassword === "string" && body.newPassword.length) {
      if (body.newPassword.length < 4 || body.newPassword.length > 128) {
        return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون بين 4 و128 حرفاً" }, { status: 400 });
      }
      updates.password_hash = crypto.createHmac("sha256", getSecret()).update(body.newPassword).digest("hex");
    }
    if (!Object.keys(updates).length) return NextResponse.json({ error: "لا توجد تغييرات صالحة للحفظ" }, { status: 400 });

    const { data: user, error } = await supabaseAdmin.from("users")
      .update(updates).eq("id", session.id).select(USER_FIELDS).single();
    if (error || !user) return NextResponse.json({ error: "تعذر تحديث البيانات" }, { status: 500 });

    setSession({
      id: String(user.id),
      role: user.role,
      name: user.name,
      phone: user.phone,
      my_ref_code: user.my_ref_code,
    });
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "حدث خطأ أثناء تحديث البيانات" }, { status: 500 });
  }
}

export async function DELETE() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
