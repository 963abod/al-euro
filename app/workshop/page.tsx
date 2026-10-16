"use client";
import {Wallet,Clock} from "lucide-react";
import {TIERS,usd} from "@/lib/data";
import {H,Row} from "@/components/ui";

const spend=3400,left=12;
const cash=[
  ["INV-1042","فلتر زيت ×4","12/10",72],
  ["INV-1038","طقم فحمات BMW","03/10",150],
  ["INV-1029","بوجيات VW ×8","25/09",96]
];
const debt=[
  ["INV-1051","مساعد أمامي ×2","28/09",420],
  ["INV-1047","مضخة مياه","02/10",95]
];

const Tbl=({t,rows,c}:{t:string;rows:(string|number)[][];c:string})=>
  <div className="rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
    <h3 className={`mb-2 font-semibold tracking-tight ${c}`}>{t}</h3>
    {rows.map(r=>
      <Row key={r[0]}>
        <span>
          {r[1]}
          <small className="block text-white/45">
            {r[0]} · {r[2]}
          </small>
        </span>
        <b className="font-semibold text-white">{usd(r[3] as number)}</b>
      </Row>
    )}
    <p className="mt-2 text-end text-sm text-white/65">
      الإجمالي: {usd(rows.reduce((s,r)=>s+(r[3] as number),0))}
    </p>
  </div>;

export default function W(){
  const i=TIERS.reduce((a,t,k)=>spend>=t.min?k:a,0),
    n=TIERS[i+1],
    pct=n
      ?Math.round((spend-TIERS[i].min)/(n.min-TIERS[i].min)*100)
      :100;

  return(
    <>
      <H t="لوحة الورشة" s="ورشة النجم للميكانيك"/>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
          <Wallet className="mb-2 text-[#0A84FF]"/>
          <p className="text-sm text-white/65">محفظة الكاش باك</p>
          <b className="text-3xl font-semibold tracking-tight text-white">{usd(96.5)}</b>
          <p className="mt-1 text-xs text-white/45">
            معلّق حتى تسديد الدين: {usd(8.6)}
          </p>
        </div>

        <div className={`rounded-[24px] border bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300 ${left<=7?"border-[#FF453A]/60":"border-white/[0.14]"}`}>
          <Clock className={`mb-2 ${left<=7?"text-[#FF453A]":"text-[#0A84FF]"}`}/>
          <p className="text-sm text-white/65">عدّاد تسديد الدين</p>
          <b className="text-3xl font-semibold tracking-tight text-white">{left} يومًا</b>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40 shadow-inner">
            <div
              className={`h-full rounded-full ${left<=7?"bg-[#FF453A]":"bg-gradient-to-b from-[#3A9BFD] to-[#007AFF]"}`}
              style={{width:`${(30-left)/30*100}%`}}
            />
          </div>
        </div>
      </div>

      <div className="my-4 rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
        <div className="mb-2 flex flex-wrap justify-between gap-1 text-sm text-white">
          <span>
            مرتبتك: <b className="font-semibold text-[#0A84FF]">{TIERS[i].n}</b>
            {" · "}كاش باك {TIERS[i].cb}
          </span>
          {n&&
            <span className="text-white/65">
              باقي {usd(n.min-spend)} للوصول إلى {n.n}
            </span>
          }
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-black/40 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-l from-[#007AFF] to-[#3A9BFD] shadow-[0_0_12px_rgba(10,132,255,0.5)] transition-all"
            style={{width:`${pct}%`}}
          />
        </div>

        <div className="mt-3 grid grid-cols-5 text-center text-[11px]">
          {TIERS.map((t,k)=>
            <span
              key={t.n}
              className={k<=i?"font-semibold text-[#0A84FF]":"text-white/45"}
            >
              {t.n}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Tbl t="مسحوبات كاش" rows={cash} c="text-[#30D158]"/>
        <Tbl t="مسحوبات دين" rows={debt} c="text-[#FF9F0A]"/>
      </div>
    </>
  );
}