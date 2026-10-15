"use client";
import {createContext,useContext,useState} from "react";
type C={items:Record<number,number>;add:(id:number)=>void;dec:(id:number)=>void;clear:()=>void;count:number};
const Ctx=createContext<C>(null!);
export const useCart=()=>useContext(Ctx);
export function CartProvider({children}:{children:React.ReactNode}){
const [items,set]=useState<Record<number,number>>({});
const add=(id:number)=>set(s=>({...s,[id]:(s[id]||0)+1}));
const dec=(id:number)=>set(s=>{const n={...s,[id]:(s[id]||0)-1};if(n[id]<=0)delete n[id];return n});
return <Ctx.Provider value={{items,add,dec,clear:()=>set({}),count:Object.values(items).reduce((a,b)=>a+b,0)}}>{children}</Ctx.Provider>}
