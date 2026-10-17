"use client";
import React, { useState } from "react";
import { Wrench, Share2, CheckCircle2, Clock, LogIn, UserPlus, ShieldCheck } from "lucide-react";

const AVAILABLE_BRANDS = [
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Range Rover",
  "Porsche",
  "أخرى",
];

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"workshop" | "marketer">("workshop");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [license, setLicense] = useState("");
  const [city, setCity] = useState("حلب");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(["Mercedes-Benz"]);
  const [otherBrandText, setOtherBrandText] = useState("");
  const [refCode, setRefCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingNotice, setPendingNotice] = useState("");

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setMsg("");
    setPendingNotice("");

    let finalSpecs = "";
    if (authMode === "register" && role === "workshop") {
      if (selectedBrands.length === 0) {
        setErrorMsg("يرجى اختيار ماركة واحدة على الأقل لاختصاص الورشة");
        return;
      }
      if (selectedBrands.includes("أخرى") && !otherBrandText.trim()) {
        setErrorMsg("يرجى كتابة اسم الماركة الإضافية في حقل (أخرى)");
        return;
      }
      finalSpecs = selectedBrands
        .map((b) => (b === "أخرى" ? `أخرى (${otherBrandText.trim()})` : b))
        .join("، ");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: authMode,
          role,
          name,
          phone,
          password,
          license,
          city,
          spec: finalSpecs,
          refCode,
        }),
      });
      const data = await res.json();

      if (data.pendingApproval) {
        setPendingNotice(
          data.message ||
            data.error ||
            "حساب الورشة قيد المراجعة من قبل الإدارة. سيتم تفعيله بعد التحقق من البيانات."
        );
        return;
      }

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "تعذر إتمام العملية");
        return;
      }

      setMsg("تم تسجيل الدخول بنجاح! جاري تحويلك...");
      const targetRole = data.user?.role || role;
      window.setTimeout(() => {
        window.location.href = targetRole === "workshop" ? "/workshop" : "/marketer";
      }, 800);
    } catch {
      setErrorMsg("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
          بوابة الحسابات — اليورو
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          سجّل دخولك أو أنشئ حساباً جديداً للوصول إلى خدمات المنصة
        </p>
      </div>

      {/* التبديل الرئيسي: تسجيل الدخول / إنشاء حساب جديد */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          background: "rgba(255,255,255,0.03)",
          padding: 6,
          borderRadius: 16,
          border: "1px solid var(--border)",
          marginBottom: 22,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setAuthMode("login");
            setErrorMsg("");
            setPendingNotice("");
            setMsg("");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            border: "none",
            background: authMode === "login" ? "var(--primary, #2563eb)" : "transparent",
            color: authMode === "login" ? "#fff" : "var(--muted)",
            transition: "0.2s",
          }}
        >
          <LogIn size={18} />
          تسجيل الدخول
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode("register");
            setErrorMsg("");
            setPendingNotice("");
            setMsg("");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            border: "none",
            background: authMode === "register" ? "var(--primary, #2563eb)" : "transparent",
            color: authMode === "register" ? "#fff" : "var(--muted)",
            transition: "0.2s",
          }}
        >
          <UserPlus size={18} />
          إنشاء حساب جديد
        </button>
      </div>

      {/* إشعار انتظار موافقة الإدارة للورشات */}
      {pendingNotice && (
        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 20,
            border: "1px solid rgba(245, 158, 11, 0.45)",
            background: "rgba(245, 158, 11, 0.08)",
            textAlign: "center",
          }}
        >
          <Clock size={36} style={{ color: "#f59e0b", margin: "0 auto 10px" }} />
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fbbf24", marginBottom: 6 }}>
            طلبك قيد المراجعة لدى الإدارة
          </h3>
          <p style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.7 }}>
            {pendingNotice}
          </p>
        </div>
      )}

      {/* في حال إنشاء حساب جديد: اختيار نوع الحساب */}
      {authMode === "register" && (
        <div
          className="card"
          style={{
            padding: 10,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => setRole("workshop")}
            style={{
              padding: 14,
              borderRadius: 12,
              cursor: "pointer",
              border:
                role === "workshop"
                  ? "1.5px solid var(--primary)"
                  : "1px solid var(--border)",
              background:
                role === "workshop" ? "rgba(37, 99, 235, 0.12)" : "transparent",
              color: "var(--text)",
              textAlign: "center",
            }}
          >
            <Wrench size={20} style={{ margin: "0 auto 6px", color: "#3b82f6" }} />
            <div style={{ fontWeight: 800, fontSize: 14 }}>حساب ورشة / شركة</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              شراء آجل، دفتر ديون، كاش باك (يتطلب موافقة الإدارة)
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole("marketer")}
            style={{
              padding: 14,
              borderRadius: 12,
              cursor: "pointer",
              border:
                role === "marketer"
                  ? "1.5px solid var(--accent)"
                  : "1px solid var(--border)",
              background:
                role === "marketer" ? "rgba(245, 158, 11, 0.12)" : "transparent",
              color: "var(--text)",
              textAlign: "center",
            }}
          >
            <Share2 size={20} style={{ margin: "0 auto 6px", color: "#f59e0b" }} />
            <div style={{ fontWeight: 800, fontSize: 14 }}>حساب عميل / مسوّق</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              شراء مباشر + عمولات تسويق 2% (تفعيل فوري)
            </div>
          </button>
        </div>
      )}

      {/* نموذج الإدخال */}
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ padding: 24, display: "grid", gap: 14 }}
      >
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>
            {authMode === "login"
              ? "تسجيل الدخول إلى حسابك"
              : role === "workshop"
              ? "طلب اعتماد ورشة أو شركة جديدة"
              : "إنشاء حساب عميل / مسوّق فوري"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            {authMode === "login"
              ? "أدخل رقم الموبايل وكلمة المرور المسجلين لدينا"
              : role === "workshop"
              ? "يرجى إدخال بيانات الترخيص بدقة ليتم تفعيل الحساب وسقف الدين من قبل الإدارة"
              : "حساب موحد للشراء المباشر وكسب عمولات دعوة الورشات"}
          </p>
        </div>

        {authMode === "register" && (
          <input
            className="input"
            placeholder={
              role === "workshop" ? "اسم الورشة أو الشركة الرسمي" : "الاسم الكامل"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          className="input"
          type="tel"
          placeholder="رقم الموبايل (09XXXXXXXX)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          className="input"
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* حقول إضافية خاصة بتسجيل ورشة جديدة فقط */}
        {authMode === "register" && role === "workshop" && (
          <>
            <input
              className="input"
              placeholder="رقم السجل التجاري / ترخيص الورشة"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              required
            />

            <select
              className="select"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="حلب">المحافظة: حلب</option>
              <option value="دمشق">المحافظة: دمشق</option>
              <option value="حمص">المحافظة: حمص</option>
              <option value="حماة">المحافظة: حماة</option>
              <option value="اللاذقية">المحافظة: اللاذقية</option>
              <option value="طرطوس">المحافظة: طرطوس</option>
            </select>

            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 10,
                  color: "var(--muted)",
                }}
              >
                اختصاص الورشة (يمكنك اختيار أكثر من ماركة):
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {AVAILABLE_BRANDS.map((brand) => {
                  const active = selectedBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: active
                          ? "1.5px solid #3b82f6"
                          : "1px solid var(--border)",
                        background: active
                          ? "rgba(59, 130, 246, 0.18)"
                          : "transparent",
                        color: active ? "#60a5fa" : "var(--muted)",
                      }}
                    >
                      {active ? "✓ " : "+ "} {brand}
                    </button>
                  );
                })}
              </div>

              {selectedBrands.includes("أخرى") && (
                <input
                  className="input"
                  style={{ marginTop: 10 }}
                  placeholder="اكتب اسم الماركة أو الاختصاص الإضافي..."
                  value={otherBrandText}
                  onChange={(e) => setOtherBrandText(e.target.value)}
                  required
                />
              )}
            </div>

            <input
              className="input"
              placeholder="كود المسوّق إن وجد (مثال: MK-8F4A2C)"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#93c5fd",
                background: "rgba(37, 99, 235, 0.08)",
                padding: "10px 12px",
                borderRadius: 10,
              }}
            >
              <ShieldCheck size={18} />
              <span>
                حفاظاً على موثوقية التعامل الآجل، يتم تفعيل حسابات الورشات بعد مراجعة الإدارة.
              </span>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className={
            authMode === "register" && role === "marketer"
              ? "btn-accent"
              : "btn-primary"
          }
          style={{ marginTop: 6, padding: 14, fontSize: 15 }}
        >
          {loading
            ? "جاري المعالجة..."
            : authMode === "login"
            ? "تسجيل الدخول"
            : role === "workshop"
            ? "إرسال طلب اعتماد الورشة للإدارة"
            : "إنشاء حساب عميل / مسوّق فوراً"}
        </button>

        {errorMsg && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.12)",
              color: "#f87171",
              fontSize: 13,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        {msg && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(16, 185, 129, 0.12)",
              color: "#34d399",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <CheckCircle2 size={16} /> {msg}
          </div>
        )}
      </form>
    </div>
  );
}
