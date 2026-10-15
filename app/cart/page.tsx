"use client";
import {useState,useEffect} from "react";
import {Banknote,Landmark,BookOpen,Upload,CheckCircle2,Minus,Plus,AlertTriangle} from "lucide-react";
import {PARTS,usd} from "@/lib/data";
import {useCart} from "@/components/cart";
import {H} from "@/components/ui";

type Role = "workshop" | "marketer";
const PAY = [
  ["sham","شام كاش",Landmark,"حوّل المبلغ وأرفق إشعار التحويل"],
  ["cod","كاش عند الاستلام",Banknote,"ادفع نقدًا للمندوب"],
  ["debt","دفتر الدين (للورشات)",BookOpen,"بعد موافقة الأدمن يبدأ عدّاد 30 يومًا"]
] as const;

export default function Cart(){
  const {items,add,dec,clear}=useCart();
  const [role,setRole]=useState<Role|null>(null);
  const [sessionLoaded,setSessionLoaded]=useState(false);
  const [pay,setPay]=useState<string>("cod");
  const [file,setFile]=useState("");
  const [done,setDone]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [err,setErr]=useState("");

  useEffect(()=>{
    let active=true;
    fetch("/api/auth")
      .then(r=>r.json())
      .then(d=>{
        if(!active) return;
        const nextRole: Role|null =
          d?.user?.role==="workshop" || d?.user?.role==="marketer"
            ? d.user.role
            : null;
        setRole(nextRole);
        if(nextRole!=="workshop") setPay(current=>current==="debt"?"cod":current);
      })
      .catch(()=>{
        if(active){
          setRole(null);
          setPay(current=>current==="debt"?"cod":current);
        }
      })
      .finally(()=>{if(active)setSessionLoaded(true);});
    return ()=>{active=false;};
  },[]);

  const rows=PARTS.filter(p=>items[p.id]);
  const total=rows.reduce((s,p)=>s+p.price*items[p.id],0);
  const canPayByDebt=sessionLoaded && role==="workshop";
  const paymentOptions=PAY.filter(([key])=>key!=="debt" || canPayByDebt);

  useEffect(()=>{
    if(sessionLoaded && !canPayByDebt && pay==="debt") setPay("cod");
  },[sessionLoaded,canPayByDebt,pay]);

  if(done) return <div className="card mx-auto mt-16 max-w-md text-center"><CheckCircle2 className="mx-auto mb-3 text-gold" size={48}/><h2 className="text-xl font-bold">تم إرسال الطلب</h2><p className="mt-1 text-sm text-zinc-500">{done==="debt"?"طلبك بانتظار موافقة الأدمن على الدين.":"سنتواصل معك لتأكيد التوصيل."}</p></div>;

  return(<>
    <H t="السلة وإتمام الطلب" s="توصيل وشحن لكافة المحافظات السورية"/>
    {!rows.length
      ? <p className="card text-center text-zinc-500">السلة فارغة. أضف قطعًا من الكتالوج.</p>
      : <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="card space-y-3">
            {rows.map(p=><div key={p.id} className="flex items-center gap-2">
              <div className="flex-1 text-sm"><b>{p.name}</b><p className="text-xs text-zinc-500">{p.brand} · {p.pn}</p></div>
              <button onClick={()=>dec(p.id)} className="btn2 !p-1.5" aria-label={"تقليل كمية "+p.name}><Minus size={14}/></button>
              <span className="w-5 text-center">{items[p.id]}</span>
              <button onClick={()=>add(p.id)} className="btn2 !p-1.5" aria-label={"زيادة كمية "+p.name}><Plus size={14}/></button>
              <b className="w-16 text-end">{usd(p.price*items[p.id])}</b>
            </div>)}
            <p className="border-t border-zinc-200 pt-3 text-end text-lg font-black dark:border-zinc-800">{usd(total)}</p>
          </div>

          <div className="card space-y-3">
            <h3 className="font-bold">طريقة الدفع</h3>
            {!sessionLoaded && <p className="text-xs text-zinc-500">جارٍ التحقق من نوع الحساب...</p>}
            {paymentOptions.map(([key,label,Icon,description])=>(
              <button
                key={key}
                onClick={()=>setPay(key)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start text-sm transition ${pay===key?"border-gold bg-gold/10":"border-zinc-300 dark:border-zinc-700"}`}
              >
                <Icon className="shrink-0 text-gold" size={20}/>
                <span><b>{label}</b><small className="block text-zinc-500">{description}</small></span>
              </button>
            ))}
            {pay==="sham"&&<label className="btn2 w-full cursor-pointer"><Upload size={16}/>{file||"ارفع إشعار التحويل"}<input type="file" hidden accept="image/*" onChange={e=>setFile(e.target.files?.[0]?.name||"")}/></label>}
            {pay==="debt"&&canPayByDebt&&<div className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400"><AlertTriangle size={18} className="shrink-0"/><p>عدّاد 30 يومًا يبدأ من أول قطعة دين. عند تجاوزه يتوقف السحب الآجل حتى التسديد. الكاش باك والعمولة يُصرفان بعد التسديد.<br/>المتاح من سقفك: <b>{usd(1200)}</b></p></div>}
            {err && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                {err}
              </p>
            )}

            <button
              className="btn w-full disabled:opacity-50"
              disabled={
                !sessionLoaded ||
                submitting ||
                (pay==="sham"&&!file) ||
                (pay==="debt"&&!canPayByDebt)
              }
              onClick={async ()=>{
                setErr("");
                if(pay==="debt"&&!canPayByDebt){
                  setPay("cod");
                  return;
                }
                setSubmitting(true);
                try {
                  const res = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items, pay, file }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setErr(data.error || "تعذر إتمام الطلب");
                    return;
                  }
                  setDone(pay);
                  clear();
                } catch {
                  setErr("حدث خطأ في الاتصال بالخادم");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "جارٍ تأكيد الطلب..." : `تأكيد الطلب · ${usd(total)}`}
            </button>
            {sessionLoaded && role!=="workshop" && <p className="text-center text-xs text-zinc-500">الدفع بالدين متاح حصريًا لحسابات الورشات.</p>}
          </div>
        </div>
    }
  </>);
}
