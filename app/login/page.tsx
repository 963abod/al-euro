"use client";
import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {Wrench, Share2, LogOut, AlertCircle} from "lucide-react";
import {H} from "@/components/ui";
import {BRANDS} from "@/lib/data";

export default function Login(){
  const router = useRouter();
  const [tab, setTab] = useState<"workshop"|"marketer">("workshop");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [license, setLicense] = useState("");
  const [city, setCity] = useState("");

  // تحويل اختصاص السيارات إلى مصفوفة (اختيار متعدد) مع دعم "أخرى"
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([BRANDS[0] || "Mercedes-Benz"]);
  const [otherSpec, setOtherSpec] = useState("");

  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<{role: "workshop"|"marketer"; name: string} | null>(null);

  useEffect(()=>{
    fetch("/api/auth")
      .then(r => r.json())
      .then(d => {
        if(d?.user){
          setCurrentUser(d.user);
          setTab(d.user.role);
        }
      })
      .catch(()=>{});
  },[]);

  const toggleSpec = (b: string) => {
    if (selectedSpecs.includes(b)) {
      if (selectedSpecs.length > 1) {
        setSelectedSpecs(selectedSpecs.filter(item => item !== b));
      }
    } else {
      setSelectedSpecs([...selectedSpecs, b]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const finalSpecs = selectedSpecs.includes("أخرى") && otherSpec.trim()
      ? [...selectedSpecs.filter(s => s !== "أخرى"), `أخرى: ${otherSpec.trim()}`]
      : selectedSpecs;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: tab,
          name: name.trim(),
          phone: phone.trim(),
          password,
          license: tab === "workshop" ? license.trim() : undefined,
          city: tab === "workshop" ? city.trim() : undefined,
          spec: tab === "workshop" ? finalSpecs.join(", ") : undefined,
          refCode: tab === "workshop" ? refCode.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل تسجيل الدخول، تأكد من البيانات");
        setLoading(false);
        return;
      }

      router.push(tab === "workshop" ? "/workshop" : "/marketer");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setCurrentUser(null);
    router.refresh();
  };

  return(<>
    <H t="تسجيل الدخول والحسابات" s="اختر نوع حسابك للوصول إلى الخدمات المخصصة لك"/>

    <div className="mx-auto max-w-xl">
      {currentUser && (
        <div className="card mb-6 flex items-center justify-between border-gold/40 bg-gold/5">
          <div>
            <p className="text-xs text-zinc-400">مسجّل الدخول حالياً كـ:</p>
            <p className="font-bold text-gold">
              {currentUser.name} ({currentUser.role === "workshop" ? "حساب ورشة / شركة" : "حساب عميل / مسوّق"})
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
          >
            <LogOut size={14}/>
            تسجيل الخروج
          </button>
        </div>
      )}

      {/* أزرار اختيار نوع الحساب */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={()=>{setTab("workshop"); setError("");}}
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
          onClick={()=>{setTab("marketer"); setError("");}}
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

      {/* فورم التسجيل والدخول */}
      <form onSubmit={handleSubmit} className="card grid gap-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0"/>
            <span>{error}</span>
          </div>
        )}

        {tab === "workshop" ? (
          <>
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-gold">بيانات الورشة أو الشركة المعتمدة</h3>
              <p className="text-xs text-zinc-500">تُستخدم لتفعيل سقف الدين الآجل ونظام المراتب</p>
            </div>

            <input
              className="inp w-full"
              placeholder="اسم الورشة أو الشركة (مثال: ورشة الأمانة)"
              value={name}
              onChange={e=>setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                className="inp"
                dir="ltr"
                placeholder="رقم الموبايل (09XXXXXXXX)"
                value={phone}
                onChange={e=>setPhone(e.target.value)}
                required
              />
              <input
                className="inp"
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                className="inp"
                placeholder="رقم السجل التجاري / الصناعي أو الترخيص"
                value={license}
                onChange={e=>setLicense(e.target.value)}
                required
              />
              <input
                className="inp"
                placeholder="المدينة والمنطقة الصناعية"
                value={city}
                onChange={e=>setCity(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-zinc-400">اختصاص السيارات (يمكن اختيار أكثر من ماركة):</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[...BRANDS, "أخرى"].map(b => {
                  const isSelected = selectedSpecs.includes(b);
                  return (
                    <button
                      type="button"
                      key={b}
                      onClick={()=>toggleSpec(b)}
                      className={`rounded-xl border p-2 text-xs font-medium transition ${
                        isSelected ? "border-gold bg-gold/10 text-gold" : "border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {b} {isSelected && "✓"}
                    </button>
                  );
                })}
              </div>

              {selectedSpecs.includes("أخرى") && (
                <input
                  className="inp mt-3"
                  placeholder="اكتب نوع السيارات الأخرى..."
                  value={otherSpec}
                  onChange={e=>setOtherSpec(e.target.value)}
                  required
                />
              )}
            </div>

            <input
              className="inp"
              placeholder="كود المسوّق الذي دعاك (اختياري)"
              value={refCode}
              onChange={e=>setRefCode(e.target.value)}
            />
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
            <input
              className="inp"
              dir="ltr"
              placeholder="رقم الموبايل (09XXXXXXXX)"
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              required
            />
            <input
              className="inp"
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
            />
          </>
        )}

        <button type="submit" disabled={loading} className="btn mt-2 disabled:opacity-50">
          {loading
            ? "جاري التحقق..."
            : (tab === "workshop" ? "دخول / تفعيل حساب الورشة" : "دخول / تفعيل حساب العميل والمسوّق")}
        </button>
      </form>
    </div>
  </>);
}
