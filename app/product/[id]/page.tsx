"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Package, ShoppingCart } from "lucide-react";
import { PARTS, usd } from "@/lib/data";
import { useCart } from "@/components/cart";
import { H } from "@/components/ui";

export default function ProductDetails() {
  const params = useParams<{ id: string }>();
  const part = PARTS.find((item) => item.id === Number(params.id));
  const { add } = useCart();

  if (!part) return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 p-6 text-center">
      <Package className="mx-auto mb-3" size={32} />
      <h1 className="text-xl font-bold">القطعة غير موجودة</h1>
      <Link className="btn mt-4" href="/">العودة إلى الكتالوج</Link>
    </section>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#0A84FF]"><ArrowRight size={17}/>العودة إلى الكتالوج</Link>
      <H t={part.name} s="تفاصيل القطعة والسعر والتوافق مع السيارات" />
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#0A84FF]">رقم القطعة</p>
            <code dir="ltr" className="text-lg font-semibold">{part.pn}</code>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-sm">{part.stock > 0 ? "متوفرة" : "غير متوفرة"}</span>
        </div>
        <div className="mb-5 flex items-center justify-between border-y border-white/10 py-4">
          <span className="text-sm text-white/65">السعر</span>
          <strong className="text-2xl text-[#0A84FF]">{usd(part.price)}</strong>
        </div>
        <div className="space-y-2">
          <h2 className="font-bold">الماركة الأساسية</h2>
          <p>{part.brand}</p>
        </div>
        <div className="mt-5 rounded-2xl border border-[#0A84FF]/25 bg-[#0A84FF]/10 p-4">
          <h2 className="mb-2 flex items-center gap-2 font-bold"><CheckCircle2 size={18} className="text-[#0A84FF}"/>التوافق مع السيارات الأخرى</h2>
          <p className="text-sm leading-6">قائمة الموديلات والسنوات والمحركات المتوافقة غير متوفرة حالياً ضمن قاعدة بيانات الكتالوج، لذلك لن نعرض توافقاً غير مؤكّد. أرسل رقم الشاصي (VIN) أو اطلب مطابقة رقم القطعة للتأكد من توافقها مع سيارتك قبل الشراء.</p>
          <Link href="/special" className="mt-3 inline-flex text-sm font-semibold text-[#0A84FF]">طلب مطابقة أو قطعة خاصة</Link>
        </div>
        {part.stock > 0 ? (
          <button onClick={() => add(part.id)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#087CFA] px-4 py-3 font-bold text-white"><ShoppingCart size={18}/>إضافة للسلة</button>
        ) : (
          <Link href="/special" className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#087CFA] px-4 py-3 font-bold text-white">اطلب القطعة</Link>
        )}
      </section>
    </div>
  );
}
