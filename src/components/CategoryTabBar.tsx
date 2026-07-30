"use client";

import type { ReactNode } from "react";

export type CategoryTabItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

type CategoryTabVariant = "default" | "dark";

export function CategoryTabBar({
  items,
  value,
  onChange,
  className = "",
  variant = "default",
  maxWidthClassName,
}: {
  items: CategoryTabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: CategoryTabVariant;
  maxWidthClassName?: string;
}) {
  const sectionClassName =
    variant === "dark"
      ? "border-y border-white/10 bg-[#050505]"
      : "border-y border-[#dfe4e5]";
  const innerWidthClassName = maxWidthClassName ?? "max-w-[1500px]";

  return (
    <section className={`${sectionClassName} py-2 ${className}`}>
      <div className={`mx-auto ${innerWidthClassName} px-5 sm:px-8`}>
        <CategoryTabStrip items={items} value={value} onChange={onChange} variant={variant} />
      </div>
    </section>
  );
}

export function CategoryTabStrip({
  items,
  value,
  onChange,
  className = "",
  variant = "default",
}: {
  items: CategoryTabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: CategoryTabVariant;
}) {
  return (
    <div className={`flex gap-2 overflow-x-auto py-1 ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={
            variant === "dark"
              ? `inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap border px-3 text-sm transition ${
                  value === item.id
                    ? "border-[#f5f5f5] bg-[#f5f5f5] font-semibold text-[#050505]"
                    : "border-white/12 bg-transparent text-[#8f8f8f] hover:border-white/28 hover:text-[#f5f5f5]"
                }`
              : `inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm transition ${
                  value === item.id
                    ? "bg-[#dde4e5] font-semibold text-[#2d3435]"
                    : "bg-transparent text-[#5a6061] hover:bg-[#ebeeef] hover:text-[#2d3435]"
                }`
          }
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
