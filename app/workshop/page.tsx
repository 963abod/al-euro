"use client";
import {Wallet,Clock} from "lucide-react";
import {TIERS,usd} from "@/lib/data";
import {H,Row} from "@/components/ui";
const spend=3400,left=12;
const cash=[["INV-1042","فلتر زيت ×4","12/10",72],["INV-1038","طقم فحمات BMW","03/10",150],["INV-1029","بوجيات VW ×8","25/09",96]];
const debt=[["INV-1051","مساعد أمامي ×2","28/09",420],["INV-1047","مضخة مياه","02/10",95]];
const Tbl=({t,rows,c}:{t:string;rows:(string|number)[][];c:string})=><div className="card"><h3 className={`mb-2 font-bold ${c}`}>{t}</h3>
{rows.map(r=><Row key={r[0]}><span>{r[1]}<small className="block text-zinc-500">{r[0]} · {r[2]}</small></span><b>{usd(r[3] as number)}</b></Row>)}
<p className="mt-2 text-end text-sm text-zinc-500">الإجمالي: {usd(rows.reduce((s,r)=>s+(r[3] as number),0))}</p></div>;
export default function W(){
const i=TIERS.reduce((a,t,k)=>spend>=t.min?k:a,0),n=TIERS[i+1],pct=n?Math.round((spend-TIERS[i].min)/(n.min-TIERS[i].min)*100):100;
return(<><H t="لوحة الورشة" s="ورشة النجم للميكانيك"/>
<div className="grid gap-4 md:grid-cols-2">
<div className="card"><Wallet className="mb-2 text-gold"/><p className="text-sm text-zinc-500">محفظة الكاش باك</p><b className="text-3xl">{usd(96.5)}</b><p className="mt-1 text-xs text-zinc-500">معلّق حتى تسديد الدين: {usd(8.6)}</p></div>
<div className={`card ${left<=7?"border-red-500/60":""}`}><Clock className={`mb-2 ${left<=7?"text-red-500":"text-gold"}`}/><p className="text-sm text-zinc-500">عدّاد تسديد الدين</p><b className="text-3xl">{left} يومًا</b>
<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"><div className={`h-full ${left<=7?"bg-red-500":"bg-gold"}`} style={{width:`${(30-left)/30*100}%`}}/></div></div></div>
<div className="card my-4"><div className="mb-2 flex flex-wrap justify-between gap-1 text-sm"><span>مرتبتك: <b className="text-gold">{TIERS[i].n}</b> · كاش باك {TIERS[i].cb}</span>{n&&<span className="text-zinc-500">باقي {usd(n.min-spend)} للوصول إلى {n.n}</span>}</div>
<div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"><div className="h-full rounded-full bg-gradient-to-l from-gold to-amber-200 transition-all" style={{width:`${pct}%`}}/></div>
<div className="mt-3 grid grid-cols-5 text-center text-[11px]">{TIERS.map((t,k)=><span key={t.n} className={k<=i?"font-bold text-gold":"text-zinc-500"}>{t.n}</span>)}</div></div>
<div className="grid gap-4 md:grid-cols-2"><Tbl t="مسحوبات كاش" rows={cash} c="text-emerald-500"/><Tbl t="مسحوبات دين" rows={debt} c="text-amber-500"/></div></>)}
