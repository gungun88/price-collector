"use client";

import Link from "next/link";
import { Activity } from "lucide-react";

type SiteHeaderSection =
  | "official"
  | "channels"
  | "api"
  | "home"
  | "guides"
  | "support"
  | "wholesale"
  | "transit";

export function SiteHeader({
  maxWidthClassName = "max-w-[1500px]",
  activeSection,
  variant = "default",
}: {
  maxWidthClassName?: string;
  logoCompact?: boolean;
  activeSection?: SiteHeaderSection;
  variant?: "default" | "dark";
}) {
  const isDark = variant === "dark";
  const navItems: Array<{ href: string; label: string; section: SiteHeaderSection }> = [
    { href: "/official-prices", label: "官方订阅", section: "official" },
    { href: "/channels", label: "卡网报价", section: "channels" },
    { href: "/official-api", label: "官方接口", section: "api" },
    { href: "/api-transit", label: "中转API", section: "transit" },
  ];

  return (
    <header className={isDark ? "border-b border-white/10 bg-[#050505]/95 backdrop-blur" : "border-b border-[var(--color-border-soft)] bg-[var(--color-page)]/95 backdrop-blur"}>
      <div className={`mx-auto flex min-h-14 items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 ${maxWidthClassName}`}>
        <Link href="/" className="inline-flex min-w-0 items-center gap-3" aria-label="返回首页">
          <span className={isDark ? "grid h-7 w-7 shrink-0 place-items-center border border-white/12 bg-[#141414]" : "grid h-7 w-7 shrink-0 place-items-center rounded-sm border border-[var(--color-border)] bg-[var(--color-panel)]"}>
            <Activity size={15} className={isDark ? "text-[#f5f5f5]" : "text-[var(--color-text-primary)]"} />
          </span>
          <span className="min-w-0">
            <span className={isDark ? "block font-mono text-[15px] font-semibold leading-none text-[#f5f5f5]" : "block font-mono text-[15px] font-semibold leading-none text-[var(--color-text-primary)]"}>
              PriceAI
            </span>
            <span className={isDark ? "mt-1 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8f8f] sm:block" : "mt-1 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-soft)] sm:block"}>
              价格目录
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="主导航">
          {navItems.map((item) => {
            const active = activeSection === item.section;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-mono text-sm transition ${
                  isDark
                    ? active
                      ? "text-[#f5f5f5]"
                      : "text-[#8f8f8f] hover:text-[#f5f5f5]"
                    : active
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
