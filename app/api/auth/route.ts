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

// جلب بيانات المستخدم الحالي من الجلسة + قاعدة البيانات
export async function GET() {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ user: null });

    const session = verify(token);
    if (!session?.id) return NextResponse.json({ user: null });

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, role, name, phone, city, specs, tier, debt_limit, debt_balance, cashback_balance, my_ref_code")
      .eq("id", session.id)
      .single();

    return NextResponse.json({ user: user || session });
  } catch {
    return NextResponse.json({ user: null });
  }
}

// تسجيل دخول أو إنشاء حساب جديد في Supabase
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, name, phone, password, license, city, spec, refCode } = body;

    if (!phone || !password || !role) {
      return NextResponse.json({ error: "يرجى إدخال رقم الموبايل وكلمة المرور" }, { status: 400 });
    }

    const passHash = hashPassword(password);

    // 1. فحص إذا كان الحساب موجود مسبقاً برقم الموبايل
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: "خطأ في الاتصال بقاعدة البيانات" }, { status: 500 });
    }

    let userRecord = existingUser;

    if (existingUser) {
      // التحقق من كلمة المرور للحساب الموجود
      if (existingUser.password_hash !== passHash) {
        return NextResponse.json({ error: "كلمة المرور غير صحيحة لهذا الرقم" }, { status: 401 });
      }
      if (existingUser.role !== role) {
        return NextResponse.json(
          { error: `هذا الرقم مسجل مسبقاً كحساب ${existingUser.role === "workshop" ? "ورشة" : "مسوّق"}` },
          { status: 400 }
        );
      }
    } else {
      // 2. إنشاء حساب جديد إذا لم يكن موجوداً
      if (!name) {
        return NextResponse.json({ error: "الاسم مطلوب لإنشاء الحساب" }, { status: 400 });
      }

      const specsArray = spec
        ? spec.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      let newUser = null;
      let insertError = null;

      // محاولة الإدخال حتى 5 مرات في حال تصادم كود المسوق (خطأ 23505)
      for (let attempt = 0; attempt < 5; attempt++) {
        const generatedRefCode =
          role === "marketer"
            ? `MK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
            : null;

        const res = await supabaseAdmin
          .from("users")
          .insert({
            role,
            name,
            phone,
            password_hash: passHash,
            license: role === "workshop" ? license : null,
            city: role === "workshop" ? city : null,
            specs: specsArray,
            my_ref_code: generatedRefCode,
            referred_by_code: role === "workshop" && refCode ? refCode : null,
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
          res.error.code === "23505" &&
          res.error.message?.includes("my_ref_code");

        if (!isRefCollision) {
          break;
        }
      }

      if (insertError || !newUser) {
        return NextResponse.json(
          { error: insertError?.message || "تعذر إنشاء الحساب في قاعدة البيانات" },
          { status: 500 }
        );
      }

      userRecord = newUser;
    }

    // 3. إنشاء جلسة موقعة وحفظها في الكوكيز
    const sessionPayload = {
      id: userRecord.id,
      role: userRecord.role,
      name: userRecord.name,
      phone: userRecord.phone,
      my_ref_code: userRecord.my_ref_code,
    };

    const token = sign(sessionPayload);
    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
    });

    return NextResponse.json({ ok: true, user: sessionPayload });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "حدث خطأ غير متوقع في الخادم" },
      { status: 500 }
    );
  }
}

// تسجيل الخروج
export async function DELETE() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
