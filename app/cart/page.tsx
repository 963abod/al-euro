"use client";
import {useState} from "react";
import {Banknote,Landmark,BookOpen,Upload,CheckCircle2,Minus,Plus,AlertTriangle} from "lucide-react";
import {PARTS,usd} from "@/lib/data";
import {useCart} from "@/components/cart";
import {H} from "@/components/ui";
const PAY=[["sham","شام كاش",Landmark,"حوّل المبلغ وأرفق إشعار التحويل"],["cod","كاش عند الاستلام",Banknote,"ادفع نقدًا للمندوب"],["debt","دفتر الدين (للورشات)",BookOpen,"بعد موافقة الأدمن يبدأ عدّاد 30 يومًا"]] as const;
export default function Cart(){
const {items,add,dec,clear}=useCart();
const [pay,setPay]=useState<string>("cod"),[file,setFile]=useState(""),[done,setDone]=useState("");
const rows=PARTS.filter(p=>items[p.id]),total=rows.reduce((s,p)=>s+p.price*items[p.id],0);
if(done)return <div className="card mx-auto mt-16 max-w-md text-center"><CheckCircle2 className="mx-auto mb-3 text-gold" size={48}/><h2 className="text-xl font-bold">تم إرسال الطلب</h2><p className="mt-1 text-sm text-zinc-500">{done==="debt"?"طلبك بانتظار موافقة الأدمن على الدين.":"سنتواصل معك لتأكيد التوصيل."}</p></div>;
return(<><H t="السلة وإتمام الطلب" s="توصيل وشحن لكافة المحافظات السورية"/>
{!rows.length?<p className="card text-center text-zinc-500">السلة فارغة. أضف قطعًا من الكتالوج.</p>:
<div className="grid gap-4 lg:grid-cols-[1fr_380px]">
<div className="card space-y-3">{rows.map(p=><div key={p.id} className="flex items-center gap-2">
<div className="flex-1 text-sm"><b>{p.name}</b><p className="text-xs text-zinc-500">{p.brand} · {p.pn}</p></div>
<button onClick={()=>dec(p.id)} className="btn2 !p-1.5"><Minus size={14}/></button><span className="w-5 text-center">{items[p.id]}</span><button onClick={()=>add(p.id)} className="btn2 !p-1.5"><Plus size={14}/></button>
<b className="w-16 text-end">{usd(p.price*items[p.id])}</b></div>)}
<p className="border-t border-zinc-200 pt-3 text-end text-lg font-black dark:border-zinc-800">{usd(total)}</p></div>
<div className="card space-y-3"><h3 className="font-bold">طريقة الدفع</h3>
{PAY.map(([k,l,I,d])=><button key={k} onClick={()=>setPay(k)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start text-sm transition ${pay===k?"border-gold bg-gold/10":"border-zinc-300 dark:border-zinc-700"}`}><I className="shrink-0 text-gold" size={20}/><span><b>{l}</b><small className="block text-zinc-500">{d}</small></span></button>)}
{pay==="sham"&&<label className="btn2 w-full cursor-pointer"><Upload size={16}/>{file||"ارفع إشعار التحويل"}<input type="file" hidden accept="image/*" onChange={e=>setFile(e.target.files?.[0]?.name||"")}/></label>}
{pay==="debt"&&<div className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400"><AlertTriangle size={18} className="shrink-0"/><p>عدّاد 30 يومًا يبدأ من أول قطعة دين. عند تجاوزه يتوقف السحب الآجل حتى التسديد. الكاش باك والعمولة يُصرفان بعد التسديد.<br/>المتاح من سقفك: <b>{usd(1200)}</b></p></div>}
<button className="btn w-full" disabled={pay==="sham"&&!file} onClick={()=>{setDone(pay);clear()}}>تأكيد الطلب · {usd(total)}</button></div></div>}</>)}
