"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { ClickInfoPopover } from "@/components/ClickInfoPopover";

export function DataTableShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg bg-[var(--color-panel)] ring-1 ring-[var(--color-border-soft)] ${className}`}
    >
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function DataTableHead({
  children,
  className = "",
  compact = false,
  explanation,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  explanation?: string;
}) {
  return (
    <th className={`${compact ? "px-4" : "px-5"} py-3 text-left font-semibold ${className}`} scope="col">
      {explanation ? (
        <ClickInfoPopover
          label={plainText(children)}
          description={explanation}
          className="inline-flex max-w-full cursor-pointer items-center border-b border-dashed border-[var(--color-border-muted)] pb-0.5 text-left leading-tight text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-soft)]"
        >
          {children}
        </ClickInfoPopover>
      ) : (
        children
      )}
    </th>
  );
}

function plainText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "说明";
}

export function ViewToggleButton({
  active,
  icon,
  label,
  onClick,
  compact = false,
}: {
  active: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold transition ${
        compact ? "px-3" : "md:px-3.5"
      } ${
        active
          ? "bg-[var(--color-panel)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-soft)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      }`}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label
      className={`flex h-11 min-w-0 items-center gap-2 rounded-full bg-[var(--color-panel)] px-4 ring-1 ring-[var(--color-border-soft)] ${className}`}
    >
      <Search size={16} className="shrink-0 text-[var(--color-text-soft)]" />
      <input
        type="search"
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-soft)]"
      />
    </label>
  );
}

export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--color-text-muted)]">{label}</span>
      <select
        className="h-10 w-full truncate rounded-full bg-[var(--color-panel)] px-3 text-sm font-semibold text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border-soft)] transition focus:ring-2 focus:ring-[var(--color-border-soft)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MetricTile({
  label,
  value,
  helper,
  className = "",
}: {
  label: string;
  value: string;
  helper?: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-lg bg-[var(--color-panel)] px-3 py-2 ring-1 ring-[var(--color-border-soft)] ${className}`}>
      <p className="truncate text-[0.68rem] font-semibold text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold tabular-nums text-[var(--color-text-primary)] md:text-lg">{value}</p>
      {helper ? <p className="mt-0.5 truncate text-xs text-[var(--color-text-soft)]">{helper}</p> : null}
    </div>
  );
}

export function PriceMetric({
  label,
  value,
  helper,
  official,
  tone = "default",
  density = "regular",
}: {
  label: string;
  value: string;
  helper?: string;
  official?: string;
  tone?: "default" | "muted" | "good" | "warn";
  density?: "regular" | "compact";
}) {
  const className =
    tone === "good"
      ? "bg-[var(--color-surface-selected)] ring-[var(--color-border-soft)]"
      : tone === "warn"
        ? "bg-[var(--color-surface-hover)] ring-[var(--color-border-soft)]"
        : tone === "muted"
          ? "bg-[var(--color-surface)] ring-[var(--color-border-soft)]"
          : "bg-[var(--color-panel)] ring-[var(--color-border-soft)]";

  if (density === "compact") {
    return (
      <div className={`min-w-0 rounded-md px-2.5 py-2 ring-1 ${className}`}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="truncate text-[11px] font-bold text-[#5a6061]">{label}</p>
          {helper ? (
            <span className="shrink-0 rounded-full bg-white/75 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#5a6061] ring-1 ring-[#adb3b4]/10">
              {helper}
            </span>
          ) : null}
        </div>
        {official ? (
          <p className="mt-1 truncate text-[11px] font-semibold text-[#8b9192] line-through decoration-[#8b9192]/70">
            {official}
          </p>
        ) : null}
        <p className="mt-0.5 truncate text-sm font-extrabold tabular-nums text-[#202829]">{value}</p>
      </div>
    );
  }

  return (
    <div className={`min-w-0 rounded-lg px-3 py-2 ring-1 ${className}`}>
      <p className="text-[0.68rem] font-semibold text-[#5a6061]">{label}</p>
      {official ? (
        <p className="mt-1 truncate text-xs font-semibold text-[#8b9192] line-through decoration-[#8b9192]/70">
          {official}
        </p>
      ) : null}
      <p className="mt-1 break-words text-sm font-semibold leading-5 text-[#202829]">{value}</p>
      {helper ? <p className="mt-1 break-words text-xs leading-5 text-[#5a6061]">{helper}</p> : null}
    </div>
  );
}

export function StatusChip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "info" | "danger" | "neutral" | "muted";
  className?: string;
}) {
  const toneClass = {
    success: "bg-[var(--color-surface-selected)] text-[var(--color-text-primary)]",
    warning: "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]",
    info: "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
    danger: "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
    neutral: "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
    muted: "bg-[var(--color-surface)] text-[var(--color-text-muted)]",
  }[tone];

  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass} ${className}`}>
      {children}
    </span>
  );
}

export function MobileFilterSheet({
  open,
  title,
  description,
  children,
  resultCount,
  onClose,
  onReset,
  onApply,
  primaryLabel,
}: {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
  resultCount: number;
  onClose: () => void;
  onReset: () => void;
  onApply?: () => void;
  primaryLabel?: string;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || window.matchMedia("(min-width: 768px)").matches) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="关闭筛选"
        className="absolute inset-0 h-full w-full bg-[var(--color-text-primary)]/25 backdrop-blur-sm"
        onClick={onClose}
      />
      <section className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-2xl bg-[var(--color-page)] px-5 pb-5 pt-4 ring-1 ring-[var(--color-border-soft)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border-muted)]" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-[#202829]">{title}</p>
            <p className="mt-1 text-sm text-[#5a6061]">{description}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] outline-none transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-soft)]"
            aria-label="关闭筛选"
          >
            <X size={17} />
          </button>
        </div>
        <div className="mt-5 space-y-5">{children}</div>
        <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-[#dfe4e5] pt-4">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-hover)]"
          >
            重置
          </button>
          <button
            type="button"
            onClick={onApply ?? onClose}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-5 text-sm font-semibold text-[var(--color-page)] transition hover:opacity-90"
          >
            {primaryLabel ?? `查看 ${resultCount} 条结果`}
          </button>
        </div>
      </section>
    </div>
  );
}
