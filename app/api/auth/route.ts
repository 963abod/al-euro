import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  COOKIE_NAME,
  clearSession,
  getSession,
  hashPassword,
  safeEqual,
  setSession,
  verifySession,
} from "@/lib/session";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Never include password_hash here: this list is what is returned to the browser.
const USER_FIELDS = "id, role, name, phone, city, license, specs, tier, debt_limit, debt_balance, cashback_balance, my_ref_code, is_active, created_at";

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function serverError(context: string, err: unknown, message = "حدث خطأ غير متوقع في الخادم") {
  console.error(`[api/auth] ${context}:`, err);
  return json({ error: message }, 500);
}

export async function GET() {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) return json({ user: null });

    const session = verifySession(token);
    if (!session) {
      clearSession();
      return json({ user: null });
    }

    const { data: user, error } = await getSupabaseAdmin()
      .from("users")
      .select(USER_FIELDS)
      .eq("id", session.id)
      .single();

    if (error || !user || !user.is_active) {
      clearSession();
      return json({ user: null });
    }

    return json({ user });
  } catch (err) {
    console.error("[api/auth] GET:", err);
    return json({ user: null });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode = "login", role, name, phone, password, license, city, spec, refCode } = body ?? {};

    // "admin" accounts can only sign in; they are created / promoted manually in the database.
    const allowedRoles = mode === "login" ? ["workshop", "marketer", "admin"] : ["workshop", "marketer"];
    if (!["login", "register"].includes(mode) || !allowedRoles.includes(role)) {
      return json({ error: "نوع العملية أو الحساب غير صالح" }, 400);
    }
    if (!phone || !password || String(password).length < 4) {
      return json({ error: "يرجى إدخال رقم الموبايل وكلمة مرور من 4 أحرف على الأقل" }, 400);
    }

    const db = getSupabaseAdmin();
    const cleanPhone = String(phone).trim();
    const passHash = hashPassword(String(password));
    const { data: existingUser, error: findError } = await db
      .from("users")
      .select(`${USER_FIELDS}, password_hash`)
      .eq("phone", cleanPhone)
      .eq("role", role)
      .maybeSingle();

    if (findError) return serverError("lookup", findError, "خطأ في الاتصال بقاعدة البيانات");

    if (mode === "login") {
      if (!existingUser) return json({ error: "لا يوجد حساب مسجل بهذا الرقم ونوع الحساب." }, 404);
      if (!safeEqual(String(existingUser.password_hash ?? ""), passHash)) {
        return json({ error: "كلمة المرور غير صحيحة" }, 401);
      }
      if (!existingUser.is_active) {
        return json({
          pendingApproval: true,
          error: "حسابك قيد المراجعة من قِبل الإدارة، وسيتم تفعيله بعد التحقق من البيانات.",
        }, 403);
      }

      setSession({
        id: String(existingUser.id),
        role: existingUser.role,
        name: existingUser.name,
        phone: existingUser.phone,
        my_ref_code: existingUser.my_ref_code,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _omit, ...publicUser } = existingUser;
      return json({ ok: true, user: publicUser });
    }

    if (existingUser) return json({ error: "هذا الرقم مسجل مسبقاً بنفس نوع الحساب." }, 400);
    if (!name || !String(name).trim()) return json({ error: "الاسم مطلوب لإنشاء الحساب" }, 400);
    if (role === "workshop" && (!license || !city || !spec)) {
      return json({ error: "يرجى إدخال رقم الترخيص والمدينة واختصاص الماركات للورشة" }, 400);
    }

    const specsArray = spec
      ? String(spec).split(/[,،]/).map((s: string) => s.trim()).filter(Boolean)
      : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newUser: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let insertError: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const generatedRefCode = role === "marketer"
        ? `MK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
        : null;

      const result = await db.from("users").insert({
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
      }).select(USER_FIELDS).single();

      if (!result.error) {
        newUser = result.data;
        insertError = null;
        break;
      }
      insertError = result.error;
      if (!(result.error.code === "23505" && result.error.message?.includes("my_ref_code"))) break;
    }

    if (insertError || !newUser) {
      if (insertError?.code === "23505") return json({ error: "هذا الرقم مسجل مسبقاً أو تعذر إنشاء كود فريد." }, 400);
      return serverError("register", insertError, "تعذر إنشاء الحساب");
    }

    if (role === "workshop") {
      return json({
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
    return json({ ok: true, user: newUser });
  } catch (err) {
    return serverError("POST", err);
  }
}

export async function PUT(req: Request) {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) return json({ error: "يرجى تسجيل الدخول أولاً" }, 401);
    const session = getSession();
    if (!session) {
      clearSession();
      return json({ error: "الجلسة غير صالحة، سجّل الدخول مجدداً" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "بيانات الطلب غير صالحة" }, 400);
    }

    const updates: Record<string, string> = {};
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length < 2 || name.length > 100) return json({ error: "الاسم يجب أن يكون بين حرفين و100 حرف" }, 400);
      updates.name = name;
    }
    if (typeof body.city === "string") {
      const city = body.city.trim();
      if (city.length > 80) return json({ error: "اسم المحافظة طويل جداً" }, 400);
      if (city) updates.city = city;
    }
    if (typeof body.newPassword === "string" && body.newPassword.length) {
      if (body.newPassword.length < 4 || body.newPassword.length > 128) {
        return json({ error: "كلمة المرور الجديدة يجب أن تكون بين 4 و128 حرفاً" }, 400);
      }
      updates.password_hash = hashPassword(body.newPassword);
    }
    if (!Object.keys(updates).length) return json({ error: "لا توجد تغييرات صالحة للحفظ" }, 400);

    const { data: user, error } = await getSupabaseAdmin().from("users")
      .update(updates)
      .eq("id", session.id)
      .eq("is_active", true)
      .select(USER_FIELDS)
      .single();
    if (error || !user) return serverError("update", error, "تعذر تحديث البيانات");

    setSession({
      id: String(user.id),
      role: user.role,
      name: user.name,
      phone: user.phone,
      my_ref_code: user.my_ref_code,
    });
    return json({ ok: true, user });
  } catch (err) {
    return serverError("PUT", err, "حدث خطأ أثناء تحديث البيانات");
  }
}

export async function DELETE() {
  clearSession();
  return json({ ok: true });
}
