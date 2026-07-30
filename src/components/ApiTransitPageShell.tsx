import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { BookOpenText, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { TransitFamilyTabs } from "@/components/TransitFamilyTabs";
import { TransitSubmissionActions } from "@/components/TransitSubmissionDialog";
import type { TransitModelFamily } from "@/data/api-transit/types";

type TransitFamilyOption = {
  id: TransitModelFamily;
  label: string;
};

type ApiTransitPageShellProps = {
  eyebrow?: ReactNode;
  familyOptions: TransitFamilyOption[];
  title?: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  stats?: ReactNode;
  hideHero?: boolean;
  children: ReactNode;
};

export function ApiTransitPageShell({
  eyebrow = "PriceAI / 中转 API",
  familyOptions,
  title,
  meta,
  description,
  stats,
  hideHero = false,
  children,
}: ApiTransitPageShellProps) {
  return (
    <div className="priceai-square-ui min-h-screen bg-[#050505] text-[#f5f5f5]">
      <SiteHeader activeSection="transit" maxWidthClassName="max-w-[1500px]" variant="dark" />
      <Suspense fallback={<TransitFamilyTabsFallback />}>
        <TransitFamilyTabs options={familyOptions} variant="dark" />
      </Suspense>

      <main className="mx-auto max-w-[1500px] px-5 pb-14 pt-3 sm:px-8 md:pt-4 lg:px-10 lg:pt-5">
        {!hideHero ? (
          <section className="grid gap-4 border-b border-white/12 py-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
            <div>
              <p className="font-mono text-[0.72rem] uppercase text-[#8f8f8f]">{eyebrow}</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#f7f7f7] md:text-5xl">{title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#a3a3a3]">{description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs text-[#8f8f8f] md:gap-3">
                {meta}
              </div>
              <ActionGroup className="mt-4 flex flex-wrap items-center gap-2 sm:hidden" compactLabels />
            </div>

            <div className="hidden grid-cols-4 gap-2 md:grid xl:w-[420px]">
              {stats}
            </div>
          </section>
        ) : null}

        <Suspense fallback={<div className="py-12 text-center text-[#8f8f8f]">加载中...</div>}>
          {children}
        </Suspense>

        <Link
          href="/guides/api-transit"
          className="mt-5 flex min-h-11 items-center justify-between gap-3 border border-white/12 px-4 py-2.5 text-sm font-semibold text-[#f5f5f5] transition hover:border-white/28 hover:bg-white/[0.03] md:hidden"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <BookOpenText className="h-4 w-4 shrink-0 text-[#8f8f8f]" />
            <span className="truncate">充值系数、倍率和试用说明</span>
          </span>
          <span className="shrink-0 text-xs text-[#8f8f8f]">查看</span>
        </Link>
      </main>
    </div>
  );
}

function ActionGroup({
  className,
  compactLabels = false,
}: {
  className: string;
  compactLabels?: boolean;
}) {
  return (
    <div className={className}>
      <Link
        href="/api-transit/detector"
        className="inline-flex h-10 items-center justify-center gap-1.5 border border-[#f5f5f5] bg-[#f5f5f5] px-2 text-[0.78rem] font-semibold text-[#050505] transition hover:opacity-90 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
      >
        <ShieldCheck className="h-4 w-4 shrink-0" />
        {compactLabels ? (
          <>
            <span className="sm:hidden">检测</span>
            <span className="hidden sm:inline">模型检测</span>
          </>
        ) : (
          "模型检测"
        )}
      </Link>
      <Link
        href="/guides/api-transit"
        className="inline-flex h-10 items-center justify-center gap-1.5 border border-white/12 px-2 text-[0.78rem] font-semibold text-[#f5f5f5] transition hover:border-white/28 hover:bg-white/[0.03] sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
      >
        <BookOpenText className="h-4 w-4 shrink-0 text-[#8f8f8f]" />
        {compactLabels ? (
          <>
            <span className="sm:hidden">说明</span>
            <span className="hidden sm:inline">使用前说明</span>
          </>
        ) : (
          "使用前说明"
        )}
      </Link>
      <TransitSubmissionActions
        className="flex flex-wrap items-center gap-2.5"
        buttonSizeClassName="h-10 gap-1.5 border border-white/12 px-2 text-[0.78rem] text-[#f5f5f5] sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
        compactLabels={compactLabels}
      />
    </div>
  );
}

function TransitFamilyTabsFallback() {
  return (
    <section className="border-y border-white/10 py-2">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="h-10" />
      </div>
    </section>
  );
}
