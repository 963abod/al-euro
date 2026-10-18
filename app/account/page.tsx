"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, MapPin, Phone, ShieldCheck, LogOut, Save, UserRound, Wallet, Headset, ExternalLink, PackageCheck, Clock3 } from "lucide-react";
import { H } from "@/components/ui";

type User = {
  id: string;
  role: "workshop" | "marketer";
  name: string;
  phone: string;
  city?: string | null;
  license?: string | null;
  specs?: string[] | null;
  tier?: string | null;
  debt_limit?: number | null;
  debt_balance?: number | null;
  cashback_balance?: number | null;
  my_ref_code?: string | null;
  created_at?: string | null;
};

const CITIES = ["دمشق","ريف دمشق","حلب","حمص","حماة","اللاذقية","طرطوس","إدلب","دير الزور","الرقة","الحسكة","درعا","السويداء","القنيطرة"];

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [pendingAvatar, setPendingAvatar] = useState("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (!d.user) { router.replace("/login"); return; }
        setUser(d.user);
        setName(d.user.name || "");
        setCity(d.user.city || "");
        setAvatar(localStorage.getItem(`euro_avatar_${d.user.id}`) || "");
        setEmail(localStorage.getItem(`euro_email_${d.user.id}`) || "");
      })
      .catch(() => router.replace("/login"))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [router]);

  function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { setError("اختر ملف صورة صالحاً."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("حجم الصورة يجب ألا يتجاوز 5 ميغابايت."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAvatar(String(reader.result || ""));
      setCropZoom(1);
      setCropOffsetX(0);
      setCropOffsetY(0);
      setError("");
      setNotice("");
    };
    reader.onerror = () => setError("تعذرت قراءة الصورة. جرّب ملفاً آخر.");
    reader.readAsDataURL(file);
  }

  function saveCroppedAvatar() {
    if (!pendingAvatar || !user || !cropImageRef.current) return;
    const image = cropImageRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const context = canvas.getContext("2d");
    if (!context) { setError("تعذر تجهيز الصورة."); return; }
    const baseScale = Math.min(400 / image.naturalWidth, 400 / image.naturalHeight);
    const drawWidth = image.naturalWidth * baseScale;
    const drawHeight = image.naturalHeight * baseScale;
    const scaledWidth = drawWidth * cropZoom;
    const scaledHeight = drawHeight * cropZoom;
    const maxX = Math.max(0, (scaledWidth - 400) / 2);
    const maxY = Math.max(0, (scaledHeight - 400) / 2);
    const dx = (400 - scaledWidth) / 2 - cropOffsetX * maxX;
    const dy = (400 - scaledHeight) / 2 - cropOffsetY * maxY;
    context.fillStyle = "#171a22";
    context.fillRect(0, 0, 400, 400);
    context.drawImage(image, dx, dy, scaledWidth, scaledHeight);
    const cropped = canvas.toDataURL("image/jpeg", 0.9);
    try {
      localStorage.setItem("euro_avatar_" + user.id, cropped);
      setAvatar(cropped);
      setPendingAvatar("");
      setNotice("تم حفظ الصورة على هذا الجهاز.");
      setError("");
    } catch {
      setError("تعذر حفظ الصورة محلياً؛ اختر صورة أصغر.");
    }
  }

  function startCropDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!cropFrameRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: cropOffsetX,
      offsetY: cropOffsetY,
    };
  }

  function moveCropDrag(e: React.PointerEvent<HTMLDivElement>) {
    const start = dragState.current;
    const frame = cropFrameRef.current;
    if (!start || !frame) return;
    const rect = frame.getBoundingClientRect();
    setCropOffsetX(Math.max(-1, Math.min(1, start.offsetX + ((e.clientX - start.x) / Math.max(rect.width, 1)) * 2)));
    setCropOffsetY(Math.max(-1, Math.min(1, start.offsetY + ((e.clientY - start.y) / Math.max(rect.height, 1)) * 2)));
    // Keep the image position within the normalized crop range.
  }

  function endCropDrag() {
    dragState.current = null;
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setNotice(""); setError("");
    try {
      if (user) localStorage.setItem(`euro_email_${user.id}`, email.trim());
      const response = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, ...(newPassword ? { newPassword } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) { setError(data.error || "تعذر حفظ التعديلات"); return; }
      setUser(data.user); setName(data.user.name || ""); setCity(data.user.city || "");
      setNewPassword(""); setNotice("تم حفظ بيانات حسابك بنجاح.");
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    try { await fetch("/api/auth", { method: "DELETE" }); } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (loading || !user) {
    return <div className="grid min-h-[55vh] place-items-center text-white/60">جارٍ تحميل ملفك الشخصي...</div>;
  }

  const isWorkshop = user.role === "workshop";
  const joined = user.created_at ? new Date(user.created_at).toLocaleDateString("ar-SY") : "—";
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("");

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-4">
      <H t="ملفي الشخصي" s="إدارة بيانات حسابك وإعدادات الأمان" />

      <section className="account-card overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0A84FF]/20 via-white/[0.06] to-white/[0.02] p-5 shadow-[0_18px_55px_rgba(0,0,0,.25)]">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[26px] border border-white/20 bg-white/10 text-2xl font-black text-white shadow-inner">
              {avatar ? <img src={avatar} alt="صورة الحساب" className="h-full w-full object-contain" /> : (initials || <UserRound size={30} />)}
            </div>
            <label className="absolute -bottom-2 -end-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-[#06080E] bg-[#0A84FF] text-white" title="تغيير صورة الحساب">
              <UserRound size={15} />
              <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="break-words text-xl font-bold">{user.name}</h2>
              <span className="rounded-full border border-[#30D158]/30 bg-[#30D158]/10 px-2 py-1 text-[11px] text-[#30D158]"><BadgeCheck className="me-1 inline" size={13}/>{isWorkshop ? "حساب ورشة معتمد" : "حساب مسوّق"}</span>
            </div>
            <p className="flex items-center gap-2 text-sm text-white/60" dir="ltr"><Phone size={14}/>{user.phone}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-white/45"><Clock3 size={13}/>عضو منذ {joined}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="account-card rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/55"><PackageCheck size={17}/>إحصائيات الطلبات</div>
          <strong className="text-2xl">—</strong>
          <p className="mt-1 text-xs leading-5 text-white/45">سجل الطلبات غير متاح بعد؛ الحفظ الدائم للطلبات غير مفعّل في النظام الحالي.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/55">{isWorkshop ? <Wallet size={17}/> : <ShieldCheck size={17}/>} {isWorkshop ? "سقف دفتر الدين" : "كود المسوّق"}</div>
          <strong className="break-all text-2xl text-[#0A84FF]">{isWorkshop ? (user.debt_limit == null ? "غير محدد" : `$${Number(user.debt_limit).toLocaleString("en-US")}`) : (user.my_ref_code || "غير متوفر")}</strong>
          {isWorkshop && <p className="mt-1 text-xs text-white/45">الرصيد المستخدم: {user.debt_balance == null ? "غير متوفر" : `$${Number(user.debt_balance).toLocaleString("en-US")}`}</p>}
          {!isWorkshop && <p className="mt-1 text-xs text-white/45">يُستخدم هذا الكود عند تسجيل ورشة جديدة.</p>}
        </div>
      </section>

      <form onSubmit={saveProfile} className="account-card space-y-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <h3 className="flex items-center gap-2 font-bold"><UserRound size={18} className="text-[#0A84FF]"/>تعديل البيانات</h3>
        <label className="block space-y-2 text-sm text-white/65">
          الاسم
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} className="account-field w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-[#0A84FF]" />
        </label>
        <label className="block space-y-2 text-sm text-white/65">
          المحافظة
          <select value={city} onChange={(e) => setCity(e.target.value)} className="account-field w-full rounded-xl border border-white/10 bg-[#10131c] px-3 py-3 text-white outline-none focus:border-[#0A84FF]">
            <option value="">اختر المحافظة</option>
            {CITIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="block space-y-2 text-sm text-white/65">
          البريد الإلكتروني <span className="text-white/35">(محفوظ على هذا الجهاز فقط)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-[#0A84FF]" />
        </label>
        <label className="block space-y-2 text-sm text-white/65">
          كلمة مرور جديدة <span className="text-white/35">(اختياري)</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={4} maxLength={128} autoComplete="new-password" placeholder="اتركها فارغة دون تغيير" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-white outline-none focus:border-[#0A84FF]" />
        </label>
        {notice && <p role="status" className="rounded-xl bg-[#30D158]/10 p-3 text-sm text-[#30D158]">{notice}</p>}
        {error && <p role="alert" className="rounded-xl bg-[#FF453A]/10 p-3 text-sm text-[#FF8A80]">{error}</p>}
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1688ff] to-[#0066e8] px-4 py-3 font-bold disabled:opacity-60"><Save size={17}/>{saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2">
        <a href="https://wa.me/963982026134?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%20%D8%AF%D8%B9%D9%85%20%D8%A7%D9%84%D9%8A%D9%88%D8%B1%D9%88" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-4 font-semibold hover:bg-white/10"><Headset size={18} className="text-[#30D158]"/>التواصل مع الدعم</a>
      </section>

      <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#FF453A]/25 bg-[#FF453A]/10 p-4 font-bold text-[#FF8A80] hover:bg-[#FF453A]/15"><LogOut size={18}/>تسجيل الخروج</button>

      <div className="flex justify-center pb-2 pt-1">
        <a href="https://aboudweb.onrender.com" target="_blank" rel="noreferrer" className="developer-credit inline-flex items-center gap-1.5 text-xs transition-colors">
          <ExternalLink size={12}/> تطوير Aboud Web
        </a>
      </div>

      {pendingAvatar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title">
          <div className="account-modal w-full max-w-sm rounded-3xl border p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id="avatar-crop-title" className="text-lg font-bold">معاينة صورة البروفايل</h3>
              <button type="button" onClick={() => setPendingAvatar("")} className="rounded-full px-3 py-1 text-sm">إلغاء</button>
            </div>
            <div
              ref={cropFrameRef}
              className="mx-auto mb-4 h-56 w-56 touch-none cursor-grab overflow-hidden rounded-full border-2 border-[#0A84FF]/60 bg-black/10 active:cursor-grabbing"
              onPointerDown={startCropDrag}
              onPointerMove={moveCropDrag}
              onPointerUp={endCropDrag}
              onPointerCancel={endCropDrag}
              onLostPointerCapture={endCropDrag}
              aria-label="اسحب الصورة لتعديل موضعها"
            >
              <img
                ref={cropImageRef}
                src={pendingAvatar}
                alt="معاينة الصورة قبل الحفظ"
                draggable={false}
                className="pointer-events-none h-full w-full select-none object-contain"
                style={{ transform: `translate(${cropOffsetX * 25}%, ${cropOffsetY * 25}%) scale(${cropZoom})` }}
              />
            </div>
            <p className="mb-4 text-center text-xs text-white/60">اسحب الصورة بإصبعك لتغيير موضعها، واستخدم التكبير لتقريبها. ستبقى أطراف الصورة ظاهرة قدر الإمكان.</p>
            <label className="mb-3 block space-y-2 text-sm">
              <span className="flex justify-between"><span>تكبير الصورة</span><span>{cropZoom.toFixed(1)}×</span></span>
              <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} className="w-full accent-[#0A84FF]" />
            </label>
            <label className="mb-4 block space-y-2 text-sm">
              <span>تحريك أفقي</span>
              <input type="range" min="-1" max="1" step="0.05" value={cropOffsetX} onChange={(e) => setCropOffsetX(Number(e.target.value))} className="w-full accent-[#0A84FF]" />
            </label>
            <label className="mb-4 block space-y-2 text-sm">
              <span>تحريك عمودي</span>
              <input type="range" min="-1" max="1" step="0.05" value={cropOffsetY} onChange={(e) => setCropOffsetY(Number(e.target.value))} className="w-full accent-[#0A84FF]" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPendingAvatar("")} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold">إلغاء</button>
              <button type="button" onClick={saveCroppedAvatar} className="rounded-xl bg-[#0A84FF] px-4 py-3 text-sm font-bold text-white">اعتماد الصورة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
