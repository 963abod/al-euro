"use client";

import {useEffect, useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Store, UsersRound, UserCheck} from "lucide-react";
import {H} from "@/components/ui";

type AccountRole = "workshop" | "marketer";

export default function LoginPage(){
  const router = useRouter();
  const [role, setRole] = useState<AccountRole>("workshop");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(()=>{
    const savedRole = localStorage.getItem("euro_role");
    const savedName = localStorage.getItem("euro_name") || "";
    if(savedRole === "workshop" || savedRole === "marketer") setRole(savedRole);
    setName(savedName);
  },[]);

  function handleSubmit(event: FormEvent<HTMLFormElement>){
    event.preventDefault();
    const cleanName = name.trim();
    if(!cleanName){
      setError("اكتب اسمك للمتابعة.");
      return;
    }

    localStorage.setItem("euro_role", role);
    localStorage.setItem("euro_name", cleanName);
    router.replace(role === "workshop" ? "/workshop" : "/marketer");
    router.refresh();
  }

  return(
    <div className="mx-auto max-w-xl">
      <H t="الدخول إلى حسابك" s="اختر نوع الحساب واكتب الاسم الذي سيظهر في واجهة اليورو."/>
      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
        <div>
          <label htmlFor="account-name" className="mb-2 block text-sm font-bold">اسم الحساب</label>
          <input
            id="account-name"
            value={name}
            onChange={event=>{setName(event.target.value);setError("");}}
            placeholder="مثال: ورشة النجم"
            autoComplete="name"
            className="inp"
            maxLength={80}
            required
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">نوع الحساب</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={()=>setRole("workshop")}
              aria-pressed={role==="workshop"}
              className={`flex items-center gap-3 rounded-xl border p-4 text-start transition ${role==="workshop"?"border-gold bg-gold/10":"border-zinc-300 dark:border-zinc-700"}`}
            >
              <Store className="shrink-0 text-gold" size={22}/>
              <span><b className="block">حساب ورشة</b><small className="text-zinc-500">طلبات وواجهة الورشة</small></span>
            </button>
            <button
              type="button"
              onClick={()=>setRole("marketer")}
              aria-pressed={role==="marketer"}
              className={`flex items-center gap-3 rounded-xl border p-4 text-start transition ${role==="marketer"?"border-gold bg-gold/10":"border-zinc-300 dark:border-zinc-700"}`}
            >
              <UsersRound className="shrink-0 text-gold" size={22}/>
              <span><b className="block">عميل / مسوّق</b><small className="text-zinc-500">واجهة المسوّق والعميل</small></span>
            </button>
          </div>
        </fieldset>

        {error&&<p role="alert" className="text-sm text-red-500">{error}</p>}

        <button type="submit" className="btn w-full justify-center">
          <UserCheck size={18}/>
          متابعة إلى الحساب
        </button>
        <p className="text-xs leading-6 text-zinc-500">
          هذه نسخة تجريبية تحفظ الاسم ونوع الحساب على هذا الجهاز فقط. لا يوجد حالياً تحقق من الهوية أو كلمة مرور.
        </p>
      </form>
    </div>
  );
}
