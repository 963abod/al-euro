"use client";
import {useState} from "react";
import {Copy,Check,MessageCircle,EyeOff} from "lucide-react";
import {usd} from "@/lib/data";
import {H,Toggle,Row} from "@/components/ui";
const link="https://al-euro.app/r/MK-2041";
const W:[string,number,number][]=[["ورشة النجم",1200,430],["ورشة الأمانة",860,0],["ورشة الفرسان",2100,700]];
export default function M(){
const [vis,setVis]=useState(true),[cp,setCp]=useState(false);
const earned=W.reduce((s,w)=>s+w[1]*.02,0),hold=W.reduce((s,w)=>s+w[2]*.02,0);
return(<><H t="لوحة المسوّق" s="عمولة 2% مستمرة على مشتريات كل ورشة تجلبها"/>
<div className="card"><p className="mb-2 text-sm text-zinc-500">رابط الدعوة الخاص بك</p>
<div className="flex flex-wrap gap-2"><input readOnly value={link} dir="ltr" className="inp min-w-0 flex-1"/>
<button className="btn2" onClick={()=>{navigator.clipboard?.writeText(link);setCp(true)}}>{cp?<Check size={16}/>:<Copy size={16}/>}{cp?"تم النسخ":"نسخ"}</button>
<a className="btn" target="_blank" href={`https://wa.me/?text=${encodeURIComponent("سجّل ورشتك في اليورو: "+link)}`}><MessageCircle size={16}/>مشاركة عبر واتساب</a></div></div>
<div className="my-4 grid gap-4 sm:grid-cols-3">
<div className="card"><p className="text-sm text-zinc-500">عمولة مستحقة (كاش)</p><b className="text-2xl text-gold">{usd(earned)}</b></div>
<div className="card"><p className="text-sm text-zinc-500">معلّقة حتى تسديد الدين</p><b className="text-2xl">{usd(hold)}</b></div>
<div className="card"><p className="text-sm text-zinc-500">ورشات مرتبطة بك</p><b className="text-2xl">{W.length}</b></div></div>
<div className="card"><div className="mb-2 flex items-center justify-between"><h3 className="font-bold">أداء الورشات</h3>
<label className="flex items-center gap-2 text-xs text-zinc-500">صلاحية الأدمن (تجريبي)<Toggle on={vis} set={setVis}/></label></div>
{vis?W.map(w=><Row key={w[0]}><b>{w[0]}</b><span className="text-xs text-zinc-500">كاش {usd(w[1])} · دين {usd(w[2])}</span><span className="text-gold">{usd((w[1]+w[2])*.02)}</span></Row>)
:<p className="flex items-center gap-2 py-4 text-sm text-zinc-500"><EyeOff size={18}/>تفاصيل الورشات مخفية من الأدمن. يظهر لك رصيد العمولة فقط.</p>}</div></>)}
