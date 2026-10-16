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

  // اختيار عدة ماركات مع دعم خيار أخرى
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
        <div className="mb-6 flex items-center justify-between rounded-[24px] border border-[#0A84FF]/30 bg-gradient-to-b from-[#0A84FF]/[0.12] to-white/[0.03] p-4 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
          <div>
            <p className="text-xs text-white/45">مسجّل الدخول حالياً كـ:</p>
            <p className="font-semibold tracking-tight text-white">
              {currentUser.name} ({currentUser.role === "workshop" ? "حساب ورشة / شركة" : "حساب عميل / مسوّق"})
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-[#FF453A]/40 bg-[#FF453A]/20 px-3 py-2 text-xs font-medium text-[#FF6961] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:bg-[#FF453A]/30 active:scale-[0.97]"
          >
            <LogOut size={14}/>
            تسجيل الخروج
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.08] bg-black/40 p-1.5 backdrop-blur-xl shadow-inner">
        <button
          type="button"
          onClick={()=>{setTab("workshop"); setError("");}}
          className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
            tab==="workshop"
              ? "border-white/[0.22] bg-white/[0.15] text-white backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]"
              : "border-transparent text-white/60 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Wrench size={24}/>
          <div className="text-sm font-semibold">حساب ورشة / شركة</div>
          <span className="text-[11px] opacity-75">شراء آجل، دفتر ديون، كاش باك</span>
        </button>

        <button
          type="button"
          onClick={()=>{setTab("marketer"); setError("");}}
          className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
            tab==="marketer"
              ? "border-white/[0.22] bg-white/[0.15] text-white backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]"
              : "border-transparent text-white/60 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Share2 size={24}/>
          <div className="text-sm font-semibold">حساب عميل / مسوّق</div>
          <span className="text-[11px] opacity-75">شراء مباشر + عمولات تسويق 2%</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-[24px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-5 backdrop-blur-2xl saturate-150 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-all duration-300">
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#FF453A]/40 bg-[#FF453A]/20 p-3 text-xs text-[#FF6961] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <AlertCircle size={16} className="shrink-0"/>
            <span>{error}</span>
          </div>
        )}

        {tab === "workshop" ? (
          <>
            <div className="border-b border-white/[0.10] pb-3">
              <h3 className="font-semibold tracking-tight text-white">بيانات الورشة أو الشركة المعتمدة</h3>
              <p className="text-xs text-white/45">تُستخدم لتفعيل سقف الدين الآجل ونظام المراتب</p>
            </div>

            <input
              className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
              placeholder="اسم الورشة أو الشركة (مثال: ورشة الأمانة)"
              value={name}
              onChange={e=>setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
                dir="ltr"
                placeholder="رقم الموبايل (09XXXXXXXX)"
                value={phone}
                onChange={e=>setPhone(e.target.value)}
                required
              />
              <input
                className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
                placeholder="رقم السجل التجاري / الصناعي أو الترخيص"
                value={license}
                onChange={e=>setLicense(e.target.value)}
                required
              />
              <input
                className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
                placeholder="المدينة والمنطقة الصناعية"
                value={city}
                onChange={e=>setCity(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-white/45">اختصاص السيارات (يمكن اختيار أكثر من ماركة):</label>
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.08] bg-black/40 p-1.5 backdrop-blur-xl shadow-inner sm:grid-cols-3">
                {[...BRANDS, "أخرى"].map(b => {
                  const isSelected = selectedSpecs.includes(b);
                  return (
                    <button
                      type="button"
                      key={b}
                      onClick={()=>toggleSpec(b)}
                      className={`rounded-xl border p-2 text-xs transition-all ${
                        isSelected
                          ? "border-white/[0.22] bg-white/[0.15] font-semibold text-white backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]"
                          : "border-transparent font-medium text-white/60 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {b} {isSelected && "✓"}
                    </button>
                  );
                })}
              </div>

              {selectedSpecs.includes("أخرى") && (
                <input
                  className="mt-3 w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
                  placeholder="اكتب نوع السيارات الأخرى..."
                  value={otherSpec}
                  onChange={e=>setOtherSpec(e.target.value)}
                  required
                />
              )}
            </div>

            <input
              className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
              placeholder="كود المسوّق الذي دعاك (اختياري)"
              value={refCode}
              onChange={e=>setRefCode(e.target.value)}
            />
          </>
        ) : (
          <>
            <div className="border-b border-white/[0.10] pb-3">
              <h3 className="font-semibold tracking-tight text-white">تسجيل عميل / مسوّق</h3>
              <p className="text-xs text-white/45">حساب موحد للشراء المباشر وكسب عمولات دعوة الورشات</p>
            </div>

            <input
              className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
              placeholder="الاسم الكامل"
              value={name}
              onChange={e=>setName(e.target.value)}
              required
            />
            <input
              className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
              dir="ltr"
              placeholder="رقم الموبايل (09XXXXXXXX)"
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              required
            />
            <input
              className="w-full rounded-2xl border border-white/[0.10] bg-black/35 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25"
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
            />
          </>
        )}

        <button type="submit" disabled={loading} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#3A9BFD] to-[#007AFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,122,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.45)] transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50">
          {loading
            ? "جاري التحقق..."
            : (tab === "workshop" ? "دخول / تفعيل حساب الورشة" : "دخول / تفعيل حساب العميل والمسوّق")}
        </button>
      </form>
    </div>
  </>);
}