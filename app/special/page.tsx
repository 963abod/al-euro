"use client";
import {useState} from "react";
import {Camera,CheckCircle2} from "lucide-react";
import {BRANDS} from "@/lib/data";
import {H} from "@/components/ui";
export default function Special(){
const [img,setImg]=useState(""),[ok,setOk]=useState(false);
if(ok)return <div className="card mx-auto mt-16 max-w-md text-center"><CheckCircle2 className="mx-auto mb-3 text-gold" size={48}/><h2 className="text-xl font-bold">وصلنا طلبك</h2><p className="mt-1 text-sm text-zinc-500">سنؤمّن القطعة ونرسل لك السعر.</p><button className="btn mt-4" onClick={()=>{setOk(false);setImg("")}}>طلب جديد</button></div>;
return(<><H t="الطلبات الخاصة" s="القطعة غير متوفرة؟ نؤمّنها لك ونسعّرها ونسلّمها، حتى من خارج البلد"/>
<form onSubmit={e=>{e.preventDefault();setOk(true)}} className="card mx-auto grid max-w-2xl gap-4">
<select className="inp" required>{BRANDS.map(b=><option key={b}>{b}</option>)}</select>
<input className="inp" placeholder="اسم القطعة" required/>
<input className="inp" dir="ltr" placeholder="رقم القطعة أو رقم الشاصي (VIN)"/>
<textarea className="inp" rows={3} placeholder="ملاحظات: الموديل، السنة، المحرك…"/>
<label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 text-sm text-zinc-500 transition hover:border-gold dark:border-zinc-700">
{img?<img src={img} alt="" className="h-full w-full object-cover"/>:<><Camera/>صوّر القطعة القديمة أو دفتر الميكانيك/الشاصي</>}
<input type="file" accept="image/*" capture="environment" hidden onChange={e=>{const f=e.target.files?.[0];if(f)setImg(URL.createObjectURL(f))}}/></label>
<button className="btn">إرسال الطلب</button></form></>)}
