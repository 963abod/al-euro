"use client";
import {useEffect, useState} from "react";
import {Copy,Check,MessageCircle,Users} from "lucide-react";
import {usd} from "@/lib/data";
import {H} from "@/components/ui";

const LINK_BASE = "https://al-euro.app/r/";
// بيانات افتراضية لحساب الإحصائيات الإجمالية فقط دون إظهار تفاصيل الورشات الخاصة
const W: [string, number, number][] = [
  ["ورشة النجم", 1200, 430],
  ["ورشة الأمانة", 860, 0],
  ["ورشة الفرسان", 2100, 700]
];

export default function M(){
  const [cp, setCp] = useState(false);
  // The invite link must carry the signed-in marketer's own code (it used to be a hard-coded one).
  const [code, setCode] = useState("");
  useEffect(() => {
    let alive = true;
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (alive && typeof d?.user?.my_ref_code === "string") setCode(d.user.my_ref_code); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);
  const link = code ? LINK_BASE + code : "";
  const earned = W.reduce((s, w) => s + w[1] * .02, 0);
  const hold = W.reduce((s, w) => s + w[2] * .02, 0);

  return(
    <>
      <H
        t="لوحة المسوّق"
        s="عمولة 2% مستمرة على مشتريات كل ورشة تجلبها"
      />

      <div className="rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
        <p className="mb-2 text-sm text-white/65">
          رابط الدعوة الخاص بك
        </p>

        <div className="flex flex-wrap gap-2">
          <input
            readOnly
            value={link}
            placeholder="جارٍ تحميل الرابط..."
            dir="ltr"
            className="w-full min-w-0 flex-1 rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
          />

          <button
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.08] px-4 py-2.5 text-sm text-white backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-white/[0.14] active:scale-[0.97]"
            disabled={!link}
            onClick={()=>{
              navigator.clipboard?.writeText(link).then(() => setCp(true), () => setCp(false));
            }}
          >
            {cp ? <Check size={16}/> : <Copy size={16}/>}
            {cp ? "تم النسخ" : "نسخ"}
          </button>

          <a
            aria-disabled={!link}
            className={`${link ? "" : "pointer-events-none opacity-50 "}inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#3A9BFD] to-[#007AFF] px-4 py-2.5 text-sm font-semibold text-snow shadow-[0_4px_20px_rgba(0,122,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.45)] transition-all hover:brightness-110 active:scale-[0.97]`}
            target="_blank"
            rel="noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent("سجّل ورشتك في اليورو: "+link)}`}
          >
            <MessageCircle size={16}/>
            مشاركة عبر واتساب
          </a>
        </div>
      </div>

      <div className="my-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
          <p className="text-sm text-white/65">عمولة مستحقة (كاش)</p>
          <b className="text-2xl font-semibold tracking-tight text-[#30D158]">{usd(earned)}</b>
        </div>

        <div className="rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
          <p className="text-sm text-white/65">معلّقة حتى تسديد الدين</p>
          <b className="text-2xl font-semibold tracking-tight text-white">{usd(hold)}</b>
        </div>

        <div className="rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
          <p className="text-sm text-white/65">إجمالي الورشات المرتبطة</p>
          <b className="text-2xl font-semibold tracking-tight text-white">{W.length}</b>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
        <div className="rounded-xl border border-white/[0.14] bg-[#0A84FF]/15 p-3 text-[#0A84FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
          <Users size={24}/>
        </div>

        <div>
          <h3 className="font-semibold tracking-tight text-white">شبكة ورشاتك النشطة</h3>
          <p className="text-xs text-white/45">
            تستقبل عمولاتك بنسبة 2% بشكل دوري على كل طلبية يتم تسليمها للورشات المسجلة عبر رابطك.
          </p>
        </div>
      </div>
    </>
  );
}