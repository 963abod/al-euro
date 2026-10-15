"use client";
import {useState} from "react";
import {Camera, CheckCircle2} from "lucide-react";
import {BRANDS, PARTS} from "@/lib/data";
import {H} from "@/components/ui";

export default function Special(){
  const [img, setImg] = useState("");
  const [ok, setOk] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(BRANDS[0] || "Mercedes-Benz");
  const [partName, setPartName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // اقتراح أسماء القطع الموجودة في بيانات المخزون أثناء الكتابة
  const suggestions = Array.from(new Set(
    PARTS
      .map(p => p.name)
      .filter(name => partName.trim().length > 0 && name.includes(partName.trim()))
  ));

  if(ok) return <div className="card mx-auto mt-16 max-w-md text-center">
    <CheckCircle2 className="mx-auto mb-3 text-gold" size={48}/>
    <h2 className="text-xl font-bold">وصلنا طلبك</h2>
    <p className="mt-1 text-sm text-zinc-500">سنؤمّن القطعة ونرسل لك السعر.</p>
    <button className="btn mt-4" onClick={()=>{setOk(false); setImg(""); setPartName(""); setShowSuggestions(false);}}>طلب جديد</button>
  </div>;

  return(<>
    <H t="الطلبات الخاصة" s="القطعة غير متوفرة؟ نؤمّنها لك ونسعّرها ونسلّمها، حتى من خارج البلد"/>

    <form onSubmit={e=>{e.preventDefault(); setShowSuggestions(false); setOk(true)}} className="card mx-auto grid max-w-2xl gap-5">
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

      <div className="relative">
        <input
          className="inp w-full"
          placeholder="اسم القطعة (اكتب للبحث عن اقتراحات...)"
          value={partName}
          onChange={e=>{
            setPartName(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={()=>setShowSuggestions(true)}
          onBlur={()=>setTimeout(()=>setShowSuggestions(false), 150)}
          autoComplete="off"
          required
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
            {suggestions.map(item => (
              <button
                type="button"
                key={item}
                onMouseDown={e=>e.preventDefault()}
                onClick={()=>{
                  setPartName(item);
                  setShowSuggestions(false);
                }}
                className="block w-full cursor-pointer px-4 py-2.5 text-right text-sm text-zinc-200 transition hover:bg-gold/10 hover:text-gold"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <input className="inp" dir="ltr" placeholder="رقم القطعة أو رقم الشاصي (VIN)"/>

      <textarea className="inp" rows={3} placeholder="ملاحظات: الموديل، السنة، المحرك…"/>

      <label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-zinc-700 text-sm text-zinc-500 transition hover:border-gold">
        {img
          ? <img src={img} alt="معاينة صورة القطعة" className="h-full w-full object-cover"/>
          : <><Camera className="text-gold"/>صوّر القطعة القديمة أو دفتر الميكانيك/الشاصي</>
        }
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={e=>{
            const f = e.target.files?.[0];
            if(f) setImg(URL.createObjectURL(f));
          }}
        />
      </label>

      <button className="btn">إرسال الطلب</button>
    </form>
  </>);
}
