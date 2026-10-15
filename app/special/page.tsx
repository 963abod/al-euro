"use client";
import {useState} from "react";
import {Camera, CheckCircle2} from "lucide-react";
import {BRANDS} from "@/lib/data";
import {H} from "@/components/ui";

export default function Special(){
const [img, setImg] = useState("");
const [ok, setOk] = useState(false);
const [selectedBrand, setSelectedBrand] = useState(BRANDS[0] || "Mercedes-Benz");

if(ok) return <div className="card mx-auto mt-16 max-w-md text-center">
<CheckCircle2 className="mx-auto mb-3 text-gold" size={48}/>
<h2 className="text-xl font-bold">وصلنا طلبك</h2>
<p className="mt-1 text-sm text-zinc-500">سنؤمّن القطعة ونرسل لك السعر.</p>
<button className="btn mt-4" onClick={()=>{setOk(false); setImg("")}}>طلب جديد</button>
</div>;

return(<>
<H t="الطلبات الخاصة" s="القطعة غير متوفرة؟ نؤمّنها لك ونسعّرها ونسلّمها، حتى من خارج البلد"/>

<form onSubmit={e=>{e.preventDefault(); setOk(true)}} className="card mx-auto grid max-w-2xl gap-5">

{/* اختيار الماركات كـ Grid بطاقات فخمة */}
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
{BRANDS.map(b => {
  const isSelected = selectedBrand === b;
  return (
    <button
      type="button"
      key={b}
      onClick={() => setSelectedBrand(b)}
      className={`p-3 rounded-xl border text-sm font-medium transition-all text-center ${
        isSelected 
          ? "border-gold bg-gold/10 text-gold shadow-sm" 
          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
      }`}
    >
      {b}
    </button>
  );
})}
</div>

<input className="inp" placeholder="اسم القطعة" required/>

<input className="inp" dir="ltr" placeholder="رقم القطعة أو رقم الشاصي (VIN)"/>

<textarea className="inp" rows={3} placeholder="ملاحظات: الموديل، السنة، المحرك…"/>

<label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-zinc-700 text-sm text-zinc-500 transition hover:border-gold">

{img
? <img src={img} alt="" className="h-full w-full object-cover"/>
: <><Camera className="text-gold"/>صوّر القطعة القديمة أو دفتر الميكانيك/الشاصي</>
}

<input
type="file"
accept="image/*"
capture="environment"
hidden
onChange={e=>{
const f = e.target.files?.[0];
if(f) setImg(URL.createObjectURL(f))
}}
/>
</label>

<button className="btn">إرسال الطلب</button>
</form>
</>)
}
