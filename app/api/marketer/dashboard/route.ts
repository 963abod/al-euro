import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "يرجى تسجيل الدخول" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (session.role !== "marketer") return NextResponse.json({ error: "هذه الصفحة للمسوّقين فقط" }, { status: 403, headers: { "Cache-Control": "no-store" } });

  const db = getSupabaseAdmin();
  const { data: marketer, error: userError } = await db.from("users").select("id, my_ref_code").eq("id", session.id).eq("role", "marketer").maybeSingle();
  if (userError || !marketer) return NextResponse.json({ error: "تعذر تحميل بيانات المسوّق" }, { status: 500, headers: { "Cache-Control": "no-store" } });

  const [{ data: workshops, error: workshopsError }, { data: commissions, error: commissionsError }] = await Promise.all([
    db.from("users").select("id").eq("role", "workshop").eq("referred_by_code", marketer.my_ref_code),
    db.from("marketer_commissions").select("commission_amount, status").eq("marketer_id", marketer.id).limit(10000),
  ]);
  if (workshopsError || commissionsError) return NextResponse.json({ error: "تعذر تحميل إحصائيات المسوّق" }, { status: 500, headers: { "Cache-Control": "no-store" } });

  const totals = { held: 0, available: 0, paid: 0 };
  for (const row of commissions ?? []) {
    if (row.status in totals) totals[row.status as keyof typeof totals] += Number(row.commission_amount) || 0;
  }
  return NextResponse.json({ code: marketer.my_ref_code, workshops: workshops?.length ?? 0, totals }, { headers: { "Cache-Control": "no-store" } });
}