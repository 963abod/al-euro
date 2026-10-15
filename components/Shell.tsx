"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useTheme} from "next-themes";
import {Store,ShoppingCart,PackageSearch,Wrench,Share2,ShieldCheck,Sun,Moon} from "lucide-react";
import {useCart} from "./cart";
const NAV=[["/","الكتالوج",Store],["/cart","السلة",ShoppingCart],["/special","طلب خاص",PackageSearch],["/workshop","الورشة",Wrench],["/marketer","المسوّق",Share2],["/admin","الإدارة",ShieldCheck]] as const;
export default function Shell({children}:{children:React.ReactNode}){
const p=usePathname(),{theme,setTheme}=useTheme(),{count}=useCart();
return(<div className="min-h-screen md:flex">
<aside className="fixed inset-x-0 bottom-0 z-20 flex border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col md:gap-1 md:border-e md:border-t-0 md:p-4">
<div className="hidden pb-6 pt-2 md:block"><span className="text-3xl font-black text-gold">اليورو</span><p className="text-xs text-zinc-500">قطع غيار ألمانية وأوروبية</p></div>
{NAV.map(([h,l,I])=>{const a=p===h;return(
<Link key={h} href={h} className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] md:flex-none md:flex-row md:gap-3 md:rounded-xl md:px-3 md:text-sm ${a?"text-gold md:bg-gold/10":"text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}>
<I size={20}/>{l}{h==="/cart"&&count>0&&<b className="absolute end-1/4 top-1 rounded-full bg-gold px-1.5 text-[10px] text-zinc-950 md:static md:ms-auto">{count}</b>}</Link>)})}
</aside>
<main className="min-w-0 flex-1 p-4 pb-24 md:p-8">
<div className="mb-4 flex items-center justify-between"><span className="text-2xl font-black text-gold md:invisible">اليورو</span>
<button aria-label="تبديل الوضع" onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="btn2 !p-2.5"><Sun className="hidden dark:block" size={18}/><Moon className="dark:hidden" size={18}/></button></div>
{children}</main></div>)}
