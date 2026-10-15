"use client";
import {useState} from "react";
import {Check,X} from "lucide-react";
import {PARTS,usd} from "@/lib/data";
import {H,Toggle,Row} from "@/components/ui";
const S=({t,children,c=""}:{t:string;children:React.ReactNode;c?:string})=><section className={`card ${c}`}><h2 className="mb-2 font-bold text-gold">{t}</h2>{children}</section>;
export default function A(){
const [pr,setPr]=useState<Record<number,number>>(Object.fromEntries(PARTS.map(p=>[p.id,p.price])));
const [q,setQ]=useState([{id:1,w:"ورشة النجم",a:540},{id:2,w:"ورشة الفرسان",a:1100},{id:3,w:"ورشة الأمانة",a:260}]);
const [lim,setL]=useState<Record<string,number>>({"ورشة النجم":1500,"ورشة الفرسان":2000,"ورشة الأمانة":500});
const [perm,setPm]=useState<Record<string,boolean>>({"أحمد (MK-2041)":true,"سامر (MK-2057)":false,"ليلى (MK-2063)":true});
return(<><H t="لوحة الإدارة" s="الأسعار، موافقات الدين، سقوف الورشات وصلاحيات المسوّقين"/>
<div className="grid gap-4 lg:grid-cols-2">
<S t="المنتجات والأسعار" c="lg:row-span-2">{PARTS.map(p=><Row key={p.id}><span className="flex-1">{p.name}<small className="block text-zinc-500">{p.brand} · {p.pn}</small></span>
<input type="number" min={0} value={pr[p.id]} onChange={e=>setPr({...pr,[p.id]:+e.target.value})} className="inp !w-24 text-center" dir="ltr"/></Row>)}
<button className="btn mt-3 w-full">حفظ الأسعار</button></S>
<S t="طلبات الدين بانتظار الموافقة">{q.length?q.map(d=><Row key={d.id}><span className="flex-1"><b>{d.w}</b><small className="block text-zinc-500">{usd(d.a)} · عدّاد 30 يومًا عند الموافقة</small></span>
<button aria-label="موافقة" onClick={()=>setQ(q.filter(x=>x.id!==d.id))} className="btn !p-2"><Check size={16}/></button>
<button aria-label="رفض" onClick={()=>setQ(q.filter(x=>x.id!==d.id))} className="btn2 !p-2"><X size={16}/></button></Row>):<p className="py-3 text-sm text-zinc-500">لا طلبات معلّقة.</p>}</S>
<S t="سقف الدين لكل ورشة">{Object.keys(lim).map(w=><Row key={w}><span className="flex-1">{w}</span>
<input type="number" min={0} value={lim[w]} onChange={e=>setL({...lim,[w]:+e.target.value})} className="inp !w-28 text-center" dir="ltr"/></Row>)}</S>
<S t="صلاحية المسوّق: رؤية مسحوبات الورشات" c="lg:col-span-2">{Object.keys(perm).map(m=><Row key={m}><span>{m}</span><Toggle on={perm[m]} set={v=>setPm({...perm,[m]:v})}/></Row>)}</S>
</div></>)}
