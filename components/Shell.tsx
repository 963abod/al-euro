"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Store,
  ShoppingCart,
  PackageSearch,
  Wrench,
  Share2,
  Sun,
  Moon,
  UserCheck,
} from "lucide-react";
import { useCart } from "./cart";

export default function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const p = usePathname(),
    { theme, setTheme } = useTheme(),
    { count } = useCart(),
    [user, setUser] = useState<{
      role: "workshop" | "marketer";
      name: string;
    } | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setUser(d?.user || null))
      .catch(() => setUser(null));
  }, [p]);

  const NAV = [
    ["/", "الكتالوج", Store],
    ["/cart", "السلة", ShoppingCart],
    ["/special", "طلب خاص", PackageSearch],
    ...(user?.role === "workshop"
      ? [["/workshop", "الورشة", Wrench] as const]
      : user?.role === "marketer"
      ? [["/marketer", "المسوّق والعميل", Share2] as const]
      : [["/login", "حسابي", UserCheck] as const]),
  ] as const;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#06080E] text-white selection:bg-[#0A84FF]/30 md:flex">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#0A84FF]/15 blur-[110px]" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#5E5CE6]/15 blur-[120px]" />
      </div>

      <aside className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/[0.12] bg-[#06080E]/65 backdrop-blur-3xl saturate-150 shadow-[0_-8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col md:gap-1 md:border-e md:border-t-0 md:p-4 md:shadow-[0_0_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]">
        <div className="hidden pb-6 pt-2 md:block">
          <span className="text-3xl font-semibold tracking-tight text-white">
            اليورو
          </span>
          <p className="text-xs text-white/45">
            قطع غيار ألمانية وأوروبية
          </p>
        </div>

        {NAV.map(([h, l, I]) => {
          const a = p === h;

          return (
            <Link
              key={h}
              href={h}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition-all duration-300 active:scale-[0.97] md:flex-none md:flex-row md:gap-3 md:rounded-xl md:border md:px-3 md:text-sm ${
                a
                  ? "font-semibold text-[#0A84FF] md:border-white/[0.22] md:bg-white/[0.15] md:text-white md:backdrop-blur-md md:shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "text-white/60 hover:text-white md:border-transparent md:hover:bg-white/[0.05]"
              }`}
            >
              <I size={20} />
              {l}

              {h === "/cart" && count > 0 && (
                <b className="absolute end-1/4 top-1 rounded-full bg-gradient-to-b from-[#3A9BFD] to-[#007AFF] px-1.5 text-[10px] font-semibold text-white shadow-[0_2px_10px_rgba(0,122,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.45)] md:static md:ms-auto">
                  {count}
                </b>
              )}
            </Link>
          );
        })}
      </aside>

      <main className="relative z-10 min-w-0 flex-1 p-4 pb-24 md:p-8">
        <div className="sticky top-0 z-40 -mx-4 -mt-4 mb-4 flex items-center justify-between gap-2 border-b border-white/[0.12] bg-[#06080E]/65 px-4 py-3 backdrop-blur-3xl saturate-150 shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] md:-mx-8 md:-mt-8 md:px-8">
          <span className="text-2xl font-semibold tracking-tight text-white md:invisible">
            اليورو
          </span>

          <div className="ms-auto flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full border border-white/[0.16] bg-white/[0.08] px-3.5 py-2 text-xs font-medium text-white backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-white/[0.14] active:scale-[0.97]"
            >
              <UserCheck size={15} className="text-[#0A84FF]" />
              <span>
                {user
                  ? `${user.name} (${
                      user.role === "workshop"
                        ? "ورشة"
                        : "عميل/مسوّق"
                    })`
                  : "تسجيل الدخول"}
              </span>
            </Link>

            <button
              aria-label="تبديل الوضع"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="flex items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.08] p-2.5 text-white backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:bg-white/[0.14] active:scale-[0.97]"
            >
              <Sun className="hidden dark:block" size={18} />
              <Moon className="dark:hidden" size={18} />
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
