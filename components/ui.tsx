"use client";
export function Toggle({on,set}:{on:boolean;set:(v:boolean)=>void}){
return <button role="switch" aria-checked={on} onClick={()=>set(!on)} className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${on?"bg-gold":"bg-zinc-300 dark:bg-zinc-700"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${on?"-translate-x-5":""}`}/></button>}
export const H=({t,s}:{t:string;s?:string})=><div className="mb-5"><h1 className="text-2xl font-black">{t}</h1>{s&&<p className="text-sm text-zinc-500">{s}</p>}</div>;
export const Row=({children}:{children:React.ReactNode})=><div className="flex items-center justify-between gap-3 border-b border-zinc-200 py-2 text-sm last:border-0 dark:border-zinc-800">{children}</div>;
