"use client";
import {useState} from "react";
import Link from "next/link";
import {Search,Plus,ScanLine} from "lucide-react";
import {BRANDS,PARTS,usd} from "@/lib/data";
import {useCart} from "@/components/cart";
import {H} from "@/components/ui";
export default function Home(){
const [q,setQ]=useState(""),[b,setB]=useState(""),{add}=useCart();
const vin=q.trim().length===17,s=q.trim().toLowerCase();
const r=PARTS.filter(x=>(!b||x.brand===b)&&(!s||vin||x.name.includes(q.trim())||x.pn.toLowerCase().includes(s)));
return(<><H t="متجر اليورو" s="ابحث برقم القطعة أو رقم الشاصي واحصل على السعر فورًا"/>
<div className="relative"><Search className="absolute start-3 top-3.5 text-zinc-400" size={18}/>
<input value={q} onChange={e=>setQ(e.target.value)} placeholder="رقم القطعة أو رقم الشاصي (VIN)…" className="inp !py-3 ps-10"/></div>
{vin&&<p className="mt-2 flex items-center gap-2 text-sm text-gold"><ScanLine size={16}/>تم حفظ رقم الشاصي وسيُربط بالقطع المطلوبة تلقائيًا</p>}
<div className="my-4 flex gap-2 overflow-x-auto pb-1">{["",...BRANDS].map(x=>
<button key={x} onClick={()=>setB(x)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${b===x?"border-gold bg-gold font-bold text-zinc-950":"border-zinc-300 dark:border-zinc-700"}`}>{x||"الكل"}</button>)}</div>
<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{r.map(p=>
<div key={p.id} className="card flex flex-col gap-1"><span className="text-xs text-gold">{p.brand}</span><b>{p.name}</b>
<code className="text-xs text-zinc-500" dir="ltr">{p.pn}</code>
<div className="mt-auto flex items-center justify-between pt-3"><span className="text-lg font-black">{usd(p.price)}</span>
{p.stock?<button className="btn !px-3 !py-2" onClick={()=>add(p.id)}><Plus size={16}/>أضف للسلة</button>:<Link href="/special" className="btn2 !py-2 text-xs">غير متوفرة — اطلبها</Link>}</div></div>)}</div>
{!r.length&&<div className="card text-center"><p>لم تجد القطعة؟ نؤمّنها لك ولو من خارج البلد.</p><Link href="/special" className="btn mt-3">ارفعها كطلب خاص</Link></div>}</>)}
