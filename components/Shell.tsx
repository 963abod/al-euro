"use client";
import {useState, useEffect} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useTheme} from "next-themes";
import {Store,ShoppingCart,PackageSearch,Wrench,Share2,Sun,Moon,UserCheck} from "lucide-react";
import {useCart} from "./cart";

export default function Shell({children}:{children:React.ReactNode}){
  const p = usePathname(),
        {theme,setTheme} = useTheme(),
        {count} = useCart(),
        [user,setUser] = useState<{role:"workshop"|"marketer"; name:string} | null>(null);

  useEffect(()=>{
    fetch("/api/auth")
      .then(r => r.json())
      .then(d => setUser(d?.user || null))
      .catch(()=> setUser(null));
  },[p]);

  const NAV = [
    ["/","الكتالوج",Store],
    ["/cart","السلة",ShoppingCart],
    ["/special","طلب خاص",PackageSearch],
    ...(user?.role === "workshop"
      ? [["/workshop","الورشة",Wrench] as const]
      : user?.role === "marketer"
      ? [["/marketer","المسوّق والعميل",Share2] as const]
      : [["/login","حسابي",UserCheck] as const]
    )
  ] as const;

  return(
    <div className="min-h-screen md:flex">
      <aside className="fixed inset-x-0 bottom-0 z-20 flex border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col md:gap-1 md:border-e md:border-t-0 md:p-4">
        <div className="hidden pb-6 pt-2 md:block">
          <span className="text-3xl font-black text-gold">اليورو</span>
          <p className="text-xs text-zinc-500">قطع غيار ألمانية وأوروبية</p>
        </div>

        {NAV.map(([h,l,I])=>{
          const a=p===h;
          return(
            <Link
              key={h}
              href={h}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] md:flex-none md:flex-row md:gap-3 md:rounded-xl md:px-3 md:text-sm ${a?"text-gold md:bg-gold/10":"text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
            >
              <I size={20}/>
              {l}
              {h==="/cart"&&count>0&&
                <b className="absolute end-1/4 top-1 rounded-full bg-gold px-1.5 text-[10px] text-zinc-950 md:static md:ms-auto">
                  {count}
                </b>
              }
            </Link>
          );
        })}
      </aside>

      <main className="min-w-0 flex-1 p-4 pb-24 md:p-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="text-2xl font-black text-gold md:invisible">اليورو</span>

          <div className="flex items-center gap-2 ms-auto">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-gold hover:text-gold"
            >
              <UserCheck size={15} className="text-gold"/>
              <span>
                {user
                  ? `${user.name} (${user.role==="workshop" ? "ورشة" : "عميل/مسوّق"})`
                  : "تسجيل الدخول"}
              </span>
            </Link>

            <button
              aria-label="تبديل الوضع"
              onClick={()=>setTheme(theme==="dark"?"light":"dark")}
              className="btn2 !p-2.5"
            >
              <Sun className="hidden dark:block" size={18}/>
              <Moon className="dark:hidden" size={18}/>
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
