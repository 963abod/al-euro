import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

const COOKIE_NAME = "euro_session";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not defined in environment variables");
  }
  return secret;
}

function sign(payload: object): string {
  const secret = getSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token: string): any | null {
  const secret = getSecret();
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function hashPassword(password: string): string {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

export async function GET() {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ user: null });

    const session = verify(token);
    if (!session?.id) return NextResponse.json({ user: null });

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, role, name, phone, city, specs, tier, debt_limit, debt_balance, cashback_balance, my_ref_code, is_active")
      .eq("id", session.id)
      .single();

    if (!user || !user.is_active) {
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

    if (!phone || !password || !role) {
      return NextResponse.json({ error: "يرجى إدخال رقم الموبايل وكلمة المرور ونوع الحساب" }, { status: 400 });
    }

    const cleanPhone = String(phone).trim();
    const passHash = hashPassword(password);

    // البحث عن الحساب برقم الموبايل ونوع الحساب معاً
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", cleanPhone)
      .eq("role", role)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: "خطأ في الاتصال بقاعدة البيانات" }, { status: 500 });
    }

    // ==========================
    // 1. حالة تسجيل الدخول (LOGIN)
    // ==========================
    if (mode === "login") {
      if (!existingUser) {
        return NextResponse.json(
          { error: `لا يوجد حساب ${role === "workshop" ? "ورشة/شركة" : "مسوّق"} مسجل بهذا الرقم. يرجى التحقق أو إنشاء حساب جديد.` },
          { status: 404 }
        );
      }

      if (existingUser.password_hash !== passHash) {
        return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
      }

      // حساب الورشة يتطلب موافقة الإدارة
      if (role === "workshop" && !existingUser.is_active) {
        return NextResponse.json(
          {
            pendingApproval: true,
            error: "حساب الورشة/الشركة الخاص بك قيد المراجعة حالياً من قِبل الإدارة. سيتم تفعيله فور التحقق من البيانات.",
          },
          { status: 403 }
        );
      }

      const sessionPayload = {
        id: existingUser.id,
        role: existingUser.role,
        name: existingUser.name,
        phone: existingUser.phone,
        my_ref_code: existingUser.my_ref_code,
      };

      const token = sign(sessionPayload);
      cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({ ok: true, user: sessionPayload });
    }

    // ==========================
    // 2. حالة إنشاء حساب جديد (REGISTER)
    // ==========================
    if (existingUser) {
      return NextResponse.json(
        { error: `هذا الرقم مسجل مسبقاً بنفس نوع الحساب (${role === "workshop" ? "ورشة" : "مسوّق"})! انتقل لتبويب (تسجيل الدخول)` },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json({ error: "الاسم مطلوب لإنشاء الحساب" }, { status: 400 });
    }

    if (role === "workshop" && (!license || !city || !spec)) {
      return NextResponse.json(
        { error: "يرجى إدخال رقم الترخيص والمدينة واختصاص الماركات للورشة" },
        { status: 400 }
      );
    }

    const specsArray = spec
      ? spec.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const isActiveInitial = role === "workshop" ? false : true;

    let newUser = null;
    let insertError = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const generatedRefCode =
        role === "marketer"
          ? `MK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
          : null;

      const res = await supabaseAdmin
        .from("users")
        .insert({
          role,
          name: String(name).trim(),
          phone: cleanPhone,
          password_hash: passHash,
          license: role === "workshop" ? String(license).trim() : null,
          city: role === "workshop" ? String(city).trim() : null,
          specs: specsArray,
          my_ref_code: generatedRefCode,
          referred_by_code: role === "workshop" && refCode ? String(refCode).trim() : null,
          is_active: isActiveInitial,
        })
        .select("*")
        .single();

      if (!res.error) {
        newUser = res.data;
        insertError = null;
        break;
      }

      insertError = res.error;
      const isRefCollision =
        res.error.code === "23505" && res.error.message?.includes("my_ref_code");

      if (!isRefCollision) break;
    }

    if (insertError || !newUser) {
      return NextResponse.json(
        { error: insertError?.message || "تعذر إنشاء الحساب في قاعدة البيانات" },
        { status: 500 }
      );
    }

    if (role === "workshop") {
      return NextResponse.json({
        ok: true,
        pendingApproval: true,
        message: "تم إرسال طلب تسجيل الورشة/الشركة للإدارة بنجاح! سيتم مراجعة الترخيص وتفعيل حسابك قريباً.",
      });
    }

    const sessionPayload = {
      id: newUser.id,
      role: newUser.role,
      name: newUser.name,
      phone: newUser.phone,
      my_ref_code: newUser.my_ref_code,
    };

    const token = sign(sessionPayload);
    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ ok: true, user: sessionPayload });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "حدث خطأ غير متوقع في الخادم" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
