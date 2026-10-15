"use client";
import {useState} from "react";
import {Copy,Check,MessageCircle,Users} from "lucide-react";
import {usd} from "@/lib/data";
import {H} from "@/components/ui";

const link = "https://al-euro.app/r/MK-2041";
// بيانات افتراضية لحساب الإحصائيات الإجمالية فقط دون إظهار تفاصيل الورشات الخاصة
const W: [string, number, number][] = [["ورشة النجم", 1200, 430], ["ورشة الأمانة", 860, 0], ["ورشة الفرسان", 2100, 700]];

export default function M(){
  const [cp, setCp] = useState(false);
  const earned = W.reduce((s, w) => s + w[1] * .02, 0);
  const hold = W.reduce((s, w) => s + w[2] * .02, 0);

  return(<>
    <H t="لوحة المسوّق" s="عمولة 2% مستمرة على مشتريات كل ورشة تجلبها"/>
    
    <div className="card">
      <p className="mb-2 text-sm text-zinc-500">رابط الدعوة الخاص بك</p>
      <div className="flex flex-wrap gap-2">
        <input readOnly value={link} dir="ltr" className="inp min-w-0 flex-1"/>
        <button className="btn2" onClick={()=>{navigator.clipboard?.writeText(link); setCp(true)}}>
          {cp ? <Check size={16}/> : <Copy size={16}/>}{cp ? "تم النسخ" : "نسخ"}
        </button>
        <a className="btn" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent("سجّل ورشتك في اليورو: "+link)}`}>
          <MessageCircle size={16}/>مشاركة عبر واتساب
        </a>
      </div>
    </div>

    <div className="my-4 grid gap-4 sm:grid-cols-3">
      <div className="card">
        <p className="text-sm text-zinc-500">عمولة مستحقة (كاش)</p>
        <b className="text-2xl text-gold">{usd(earned)}</b>
      </div>
      <div className="card">
        <p className="text-sm text-zinc-500">معلّقة حتى تسديد الدين</p>
        <b className="text-2xl">{usd(hold)}</b>
      </div>
      <div className="card">
        <p className="text-sm text-zinc-500">إجمالي الورشات المرتبطة</p>
        <b className="text-2xl">{W.length}</b>
      </div>
    </div>

    <div className="card flex items-center gap-3">
      <div className="rounded-xl bg-gold/10 p-3 text-gold">
        <Users size={24}/>
      </div>
      <div>
        <h3 className="font-bold">شبكة ورشاتك النشطة</h3>
        <p className="text-xs text-zinc-500">تستقبل عمولاتك بنسبة 2% بشكل دوري على كل طلبية يتم تسليمها للورشات المسجلة عبر رابطك.</p>
      </div>
    </div>
  </>);
}
