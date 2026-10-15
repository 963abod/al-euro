"use client";
import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {Wrench, Share2, Building2, User, Phone, FileCheck, MapPin, KeyRound} from "lucide-react";
import {H} from "@/components/ui";
import {BRANDS} from "@/lib/data";

export default function Login(){
  const router = useRouter();
  const [tab, setTab] = useState<"workshop"|"marketer">("workshop");
  const [name, setName] = useState("");
  const [spec, setSpec] = useState(BRANDS[0] || "Mercedes-Benz");

  useEffect(()=>{
    const savedRole = localStorage.getItem("euro_role") as "workshop"|"marketer";
    if(savedRole === "workshop" || savedRole === "marketer") setTab(savedRole);
  },[]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("euro_role", tab);
    localStorage.setItem("euro_name", name);
    router.push(tab === "workshop" ? "/workshop" : "/marketer");
  };

  return(<>
    <H t="تسجيل الدخول والحسابات" s="اختر نوع حسابك للوصول إلى الخدمات المخصصة لك"/>

    <div className="mx-auto max-w-xl">
      {/* أزرار اختيار نوع الحساب */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={()=>{setTab("workshop"); setName("");}}
          className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
            tab==="workshop"
              ? "border-gold bg-gold/10 text-gold shadow-sm"
              : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
          }`}
        >
          <Wrench size={24}/>
          <div className="text-sm font-bold">حساب ورشة / شركة</div>
          <span className="text-[11px] opacity-75">شراء آجل، دفتر ديون، كاش باك</span>
        </button>

        <button
          type="button"
          onClick={()=>{setTab("marketer"); setName("");}}
          className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
            tab==="marketer"
              ? "border-gold bg-gold/10 text-gold shadow-sm"
              : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
          }`}
        >
          <Share2 size={24}/>
          <div className="text-sm font-bold">حساب عميل / مسوّق</div>
          <span className="text-[11px] opacity-75">شراء مباشر + عمولات تسويق 2%</span>
        </button>
      </div>

      {/* فورم التسجيل حسب الاختيار */}
      <form onSubmit={handleSubmit} className="card grid gap-4">
        {tab === "workshop" ? (
          <>
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-gold">بيانات الورشة أو الشركة المعتمدة</h3>
              <p className="text-xs text-zinc-500">تُستخدم لتفعيل سقف الدين الآجل ونظام المراتب</p>
            </div>

            <div className=" relative">
              <input 
                className="inp w-full" 
                placeholder="اسم الورشة أو الشركة (مثال: ورشة الأمانة)" 
                value={name}
                onChange={e=>setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input className="inp" placeholder="اسم المسؤول الثلاثي" required/>
              <input className="inp" dir="ltr" placeholder="رقم الموبايل (09XXXXXXXX)" required/>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input className="inp" placeholder="رقم السجل التجاري / الصناعي أو الترخيص" required/>
              <input className="inp" placeholder="المدينة والمنطقة الصناعية" required/>
            </div>

            <div>
              <label className="mb-2 block text-xs text-zinc-400">اختصاص السيارات الرئيسي:</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BRANDS.map(b => (
                  <button
                    type="button"
                    key={b}
                    onClick={()=>setSpec(b)}
                    className={`rounded-xl border p-2 text-xs font-medium transition ${
                      spec===b ? "border-gold bg-gold/10 text-gold" : "border-zinc-800 text-zinc-400"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <input className="inp" placeholder="كود المسوّق الذي دعاك (اختياري)"/>
          </>
        ) : (
          <>
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-gold">تسجيل عميل / مسوّق</h3>
              <p className="text-xs text-zinc-500">حساب موحد للشراء المباشر وكسب عمولات دعوة الورشات</p>
            </div>

            <input 
              className="inp" 
              placeholder="الاسم الكامل" 
              value={name}
              onChange={e=>setName(e.target.value)}
              required
            />
            <input className="inp" dir="ltr" placeholder="رقم الموبايل (09XXXXXXXX)" required/>
            <input className="inp" type="password" placeholder="كلمة المرور" required/>
          </>
        )}

        <button type="submit" className="btn mt-2">
          {tab === "workshop" ? "دخول / تفعيل حساب الورشة" : "دخول / تفعيل حساب العميل والمسوّق"}
        </button>
      </form>
    </div>
  </>);
}
