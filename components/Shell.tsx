"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Store, ShoppingCart, PackageSearch, UserRound, Sun, Moon } from "lucide-react";
import { useCart } from "./cart";

type User = {
  id: string;
  role: "workshop" | "marketer";
  name: string;
  phone: string;
  city?: string | null;
  my_ref_code?: string | null;
  debt_limit?: number | null;
  debt_balance?: number | null;
  cashback_balance?: number | null;
};

const NAV = [
  ["/", "الكتالوج", Store],
  ["/cart", "السلة", ShoppingCart],
  ["/special", "طلب خاص", PackageSearch],
  ["/account", "حسابي", UserRound],
] as const;

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { count } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!alive) return;
        const currentUser = data?.user || null;
        setUser(currentUser);
        if (!currentUser && pathname !== "/login") {
          router.replace("/login");
        } else if (currentUser && pathname === "/login") {
          router.replace("/account");
        }
      })
      .catch(() => {
        if (!alive) return;
        setUser(null);
        if (pathname !== "/login") router.replace("/login");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [pathname, router]);

  const isLogin = pathname === "/login";
  const isAuthed = Boolean(user);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#06080E] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#0A84FF]" />
          <p className="text-sm text-white/60">جارٍ تأمين الجلسة...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    if (isLogin) return <main className="min-h-screen bg-[#06080E] text-white">{children}</main>;
    return <div className="min-h-screen bg-[#06080E]" aria-hidden="true" />;
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#06080E] text-white selection:bg-[#0A84FF]/30 md:flex">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#0A84FF]/15 blur-[110px]" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#5E5CE6]/15 blur-[120px]" />
      </div>

      <aside className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/[0.12] bg-[#06080E]/80 backdrop-blur-3xl saturate-150 shadow-[0_-8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col md:gap-1 md:border-e md:border-t-0 md:p-4 md:shadow-[0_0_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]">
        <div className="hidden pb-6 pt-2 md:block">
          <span className="text-3xl font-semibold tracking-tight">اليورو</span>
          <p className="text-xs text-white/45">قطع غيار ألمانية وأوروبية</p>
        </div>
        {NAV.map(([href, label, Icon]) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <Link key={href} href={href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition-all duration-200 active:scale-[0.97] md:flex-none md:flex-row md:gap-3 md:rounded-xl md:border md:px-3 md:text-sm ${active
                ? "font-semibold text-[#0A84FF] md:border-white/[0.22] md:bg-white/[0.15] md:text-white md:backdrop-blur-md"
                : "text-white/60 hover:text-white md:border-transparent md:hover:bg-white/[0.05]"}`}>
              <Icon size={20} />
              {label}
              {href === "/cart" && count > 0 && <b className="absolute end-1/4 top-1 rounded-full bg-[#007AFF] px-1.5 text-[10px] text-white md:static md:ms-auto">{count}</b>}
            </Link>
          );
        })}
      </aside>

      <main className="relative z-10 min-w-0 flex-1 p-4 pb-24 md:p-8">
        <header className="sticky top-0 z-30 -mx-4 -mt-4 mb-4 flex items-center justify-between gap-2 border-b border-white/[0.12] bg-[#06080E]/80 px-4 py-3 backdrop-blur-3xl md:-mx-8 md:-mt-8 md:px-8">
          <Link href="/account" className="flex min-w-0 items-center gap-2 rounded-full border border-white/[0.16] bg-white/[0.08] px-3 py-2 text-xs text-white">
            <UserRound size={16} className="shrink-0 text-[#0A84FF]" />
            <span className="max-w-[45vw] truncate">{user.name || "حسابي"}</span>
          </Link>
          <button aria-label="تبديل الوضع" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center rounded-full border border-white/[0.16] bg-white/[0.08] p-2.5 text-white">
            <Sun className="hidden dark:block" size={18} />
            <Moon className="dark:hidden" size={18} />
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
