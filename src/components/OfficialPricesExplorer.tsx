"use client";

import {
  ChevronRight,
  Database,
  ExternalLink,
  Layers3,
  PackageCheck,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { BrandIcon } from "@/components/BrandIcon";
import { CategoryTabBar, CategoryTabStrip, type CategoryTabItem } from "@/components/CategoryTabBar";
import { SiteHeader } from "@/components/SiteHeader";
import { useDebouncedValue, useMediaQuery } from "@/lib/client-hooks";
import { listDetailHref, listDetailNavigationHref, shouldHandleListDetailClick } from "@/lib/list-return";
import { saveCurrentListScrollPosition, useListScrollRestoration } from "@/lib/list-scroll-restoration";
import {
  buildOfficialPriceOfferRows,
  buildOfficialPricePlanSummaries,
  type OfficialPriceAppSlug,
  type OfficialPriceOfferRow,
  type OfficialPricePlanSummary,
  type OfficialPricesDataset,
} from "@/lib/official-prices";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

type ScopeMode = "products" | "offers";
type PlatformFilter = "all" | OfficialPriceAppSlug;

const officialScopeOptions = ["products", "offers"] as const;

export function OfficialPricesExplorer({ dataset }: { dataset: OfficialPricesDataset }) {
  useListScrollRestoration();
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("products");
  const [query, setQuery] = useState("");
  const [urlStateReady, setUrlStateReady] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const debouncedQuery = useDebouncedValue(query, 250);
  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const summaries = useMemo(
    () =>
      buildOfficialPricePlanSummaries(dataset, platform)
        .filter((summary) => matchesSummary(summary, normalizedQuery))
        .sort((a, b) => comparePrice(a.lowestRow?.cnyPrice, b.lowestRow?.cnyPrice)),
    [dataset, normalizedQuery, platform],
  );
  const offers = useMemo(
    () =>
      buildOfficialPriceOfferRows(dataset, platform)
        .filter((row) => matchesOffer(row, normalizedQuery))
        .sort((a, b) => a.cnyPrice - b.cnyPrice),
    [dataset, normalizedQuery, platform],
  );
  const platformTabs = useMemo<CategoryTabItem[]>(
    () => [
      {
        id: "all",
        label: "全部",
        icon: <Layers3 size={17} className="text-current" />,
      },
      ...dataset.apps.map((app) => ({
        id: app.slug,
        label: app.displayName,
        icon: <BrandIcon platform={app.displayName} className="h-[18px] w-[18px]" />,
      })),
    ],
    [dataset.apps],
  );
  const explorerQueryString = useMemo(
    () => buildOfficialSearchParams({ platform, query, scopeMode }).toString(),
    [platform, query, scopeMode],
  );

  useEffect(() => {
    let readyFrameId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      const nextState = parseOfficialInitialState(new URLSearchParams(window.location.search), dataset);
      setPlatform(nextState.platform);
      setScopeMode(nextState.scopeMode);
      setQuery(nextState.query);
      readyFrameId = window.requestAnimationFrame(() => setUrlStateReady(true));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (readyFrameId !== null) window.cancelAnimationFrame(readyFrameId);
    };
  }, [dataset]);

  useEffect(() => {
    if (!urlStateReady) return;
    if (window.location.pathname !== "/" && window.location.pathname !== "/official-prices") return;

    const basePath = window.location.pathname === "/" ? "/" : "/official-prices";
    const nextUrl = explorerQueryString ? `${basePath}?${explorerQueryString}` : basePath;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [explorerQueryString, urlStateReady]);

  return (
    <div className="priceai-square-ui min-h-screen bg-[#050505] text-[#f5f5f5]">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
        <SiteHeader activeSection="official" maxWidthClassName="max-w-[1500px]" variant="dark" />
        <CategoryTabBar
          items={platformTabs}
          value={platform}
          onChange={(value) => setPlatform(value as PlatformFilter)}
          className="hidden md:block"
          variant="dark"
        />
      </div>

      <main className="mx-auto w-full max-w-[1500px] px-5 pb-6 pt-3 sm:px-8 md:pb-10 md:pt-4 lg:pb-12 lg:pt-5">
      <section className="mb-6 space-y-3 md:hidden">
        <label className="flex h-11 min-w-0 items-center gap-2 border border-white/14 bg-[#0b0b0b] px-3">
          <Search size={16} className="shrink-0 text-[#8f8f8f]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={scopeMode === "products" ? "搜索套餐、平台、最低地区" : "搜索套餐、地区或币种"}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#f5f5f5] outline-none placeholder:text-[#6f6f6f]"
          />
        </label>
        <div className="-mx-5 overflow-x-auto px-5">
          <CategoryTabStrip
            className="w-max pb-1"
            items={platformTabs}
            value={platform}
            onChange={(value) => setPlatform(value as PlatformFilter)}
            variant="dark"
          />
        </div>
        <div className="inline-flex h-11 max-w-full items-center overflow-x-auto border border-white/14 bg-[#0b0b0b] p-1">
          <ViewToggleButton
            active={scopeMode === "products"}
            icon={<PackageCheck size={16} />}
            label="标准"
            onClick={() => setScopeMode("products")}
          />
          <ViewToggleButton
            active={scopeMode === "offers"}
            icon={<Database size={16} />}
            label="报价"
            onClick={() => setScopeMode("offers")}
          />
        </div>
      </section>

      <section className="mb-6 hidden space-y-4 md:block">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <label className="flex h-11 min-w-0 items-center gap-2 border border-white/14 bg-[#0b0b0b] px-3 md:w-[420px]">
            <Search size={16} className="shrink-0 text-[#8f8f8f]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={scopeMode === "products" ? "搜索套餐、平台、最低地区" : "搜索套餐、地区或币种"}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#f5f5f5] outline-none placeholder:text-[#6f6f6f]"
            />
          </label>
          <div className="inline-flex h-11 shrink-0 items-center border border-white/14 bg-[#0b0b0b] p-1">
            <ViewToggleButton
              active={scopeMode === "products"}
              icon={<PackageCheck size={16} />}
              label="标准商品"
              onClick={() => setScopeMode("products")}
            />
            <ViewToggleButton
              active={scopeMode === "offers"}
              icon={<Database size={16} />}
              label="全部报价"
              onClick={() => setScopeMode("offers")}
            />
          </div>
        </div>
      </section>

      {scopeMode === "products" ? (
        summaries.length ? (
          isDesktop === false ? (
            <OfficialPlanMobileList summaries={summaries} returnQuery={explorerQueryString} />
          ) : (
            <div className="hidden md:block">
              <OfficialPlanTable summaries={summaries} returnQuery={explorerQueryString} />
            </div>
          )
        ) : (
          <EmptyState text="没有符合条件的标准套餐" />
        )
      ) : offers.length ? (
        isDesktop === false ? (
          <OfficialOfferMobileList rows={offers} returnQuery={explorerQueryString} />
        ) : (
          <div className="hidden md:block">
            <OfficialOfferTable rows={offers} returnQuery={explorerQueryString} />
          </div>
        )
      ) : (
        <EmptyState text="没有符合条件的地区报价" />
      )}

    </main>
    </div>
  );
}

function OfficialPlanMobileList({
  returnQuery,
  summaries,
}: {
  returnQuery: string;
  summaries: OfficialPricePlanSummary[];
}) {
  return (
    <section className="grid grid-cols-1 gap-3 md:hidden">
      {summaries.map((summary) => {
        const href = officialDetailHref(summary.id, returnQuery);

        return (
          <Link
            key={summary.id}
            href={href}
            prefetch={false}
            onClick={listDetailClickHandler(href, returnQuery)}
            className="border border-white/12 bg-[#0b0b0b] p-4 transition hover:border-white/24 active:scale-[0.995]"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/12 bg-[#141414] text-[#f5f5f5]">
                <BrandIcon platform={summary.platform} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold leading-6 text-[#f5f5f5]">{summary.label}</p>
                    <p className="mt-0.5 truncate text-sm text-[#8f8f8f]">{summary.provider} · {billingPeriodLabel(summary.billingPeriod)}</p>
                  </div>
                  <p className="shrink-0 text-right text-lg font-semibold tabular-nums text-[#f5f5f5]">
                    {summary.lowestRow ? formatCurrency(summary.lowestRow.cnyPrice, "CNY") : "待确认"}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs leading-5 text-[#8f8f8f]">
                  <span>最低地区：<strong className="font-semibold text-[#f5f5f5]">{summary.lowestRow?.countryLabel || "暂无"}</strong></span>
                  {summary.lowestRow ? <span>{summary.lowestRow.priceText}</span> : null}
                  <span>{summary.sampleCount} 个地区</span>
                  <span>{formatRelativeTime(summary.latestFetchedAt)}</span>
                </div>
              </div>
              <ChevronRight size={17} className="mt-3 shrink-0 text-[#6f6f6f]" />
            </div>
          </Link>
        );
      })}
    </section>
  );
}

function OfficialPlanTable({
  returnQuery,
  summaries,
}: {
  returnQuery: string;
  summaries: OfficialPricePlanSummary[];
}) {
  return (
    <section className="overflow-hidden border border-white/12 bg-[#0b0b0b]">
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-white/12 bg-[#101010] font-mono text-[0.68rem] uppercase text-[#8f8f8f]">
            <tr>
              <TableHead>标准商品</TableHead>
              <TableHead>平台</TableHead>
              <TableHead>周期</TableHead>
              <TableHead>最低地区价</TableHead>
              <TableHead>最低地区</TableHead>
              <TableHead>地区样本</TableHead>
              <TableHead>最近更新</TableHead>
              <TableHead className="w-[120px] text-center">操作</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {summaries.map((summary) => {
              const href = officialDetailHref(summary.id, returnQuery);

              return (
                <tr key={summary.id} className="transition hover:bg-white/[0.035]">
                  <td className="max-w-[320px] px-5 py-4">
                    <Link href={href} prefetch={false} onClick={listDetailClickHandler(href, returnQuery)} className="group flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/12 bg-[#141414] text-[#f5f5f5]">
                        <BrandIcon platform={summary.platform} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-[#f5f5f5] group-hover:text-white">{summary.label}</span>
                        <span className="mt-1 block truncate text-xs text-[#8f8f8f]">{summary.provider}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[#d9d9d9]">{summary.platform}</td>
                  <td className="px-5 py-4 text-[#8f8f8f]">{billingPeriodLabel(summary.billingPeriod)}</td>
                  <td className="px-5 py-4">
                    <span className="text-lg font-semibold text-[#f5f5f5]">
                      {summary.lowestRow ? formatCurrency(summary.lowestRow.cnyPrice, "CNY") : "待确认"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-[#f5f5f5]">{summary.lowestRow?.countryLabel || "暂无"}</span>
                    {summary.lowestRow ? (
                      <span className="ml-2 text-xs text-[#8f8f8f]">{summary.lowestRow.priceText}</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 font-mono text-[#d9d9d9]">{summary.sampleCount}</td>
                  <td className="px-5 py-4 text-[#8f8f8f]">{formatRelativeTime(summary.latestFetchedAt)}</td>
                  <td className="w-[120px] px-5 py-4 text-center">
                    <Link
                      href={href}
                      prefetch={false}
                      onClick={listDetailClickHandler(href, returnQuery)}
                      className="inline-flex h-8 min-w-[72px] items-center justify-center gap-1.5 whitespace-nowrap border border-white/16 px-3 text-xs font-semibold text-[#f5f5f5] transition hover:border-white/32 hover:bg-white/10"
                    >
                      查看
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OfficialOfferMobileList({
  returnQuery,
  rows,
}: {
  returnQuery: string;
  rows: OfficialPriceOfferRow[];
}) {
  return (
    <section className="grid grid-cols-1 gap-3 md:hidden">
      {rows.map((row) => (
        <OfficialOfferMobileCard key={row.id} row={row} returnQuery={returnQuery} />
      ))}
    </section>
  );
}

function OfficialOfferMobileCard({ row, returnQuery }: { row: OfficialPriceOfferRow; returnQuery: string }) {
  const href = officialDetailHref(`${row.appSlug}__${row.planSlug}`, returnQuery);

  return (
    <article className="border border-white/12 bg-[#0b0b0b] p-4 transition hover:border-white/24">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/12 bg-[#141414] text-[#f5f5f5]">
          <BrandIcon platform={row.app.displayName} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={href}
                prefetch={false}
                onClick={listDetailClickHandler(href, returnQuery)}
                className="block truncate text-base font-semibold leading-6 text-[#f5f5f5]"
              >
                {row.plan.label}
              </Link>
              <p className="mt-0.5 truncate text-sm text-[#8f8f8f]">
                {row.app.displayName} · {billingPeriodLabel(row.plan.billingPeriod)}
              </p>
            </div>
            <p className="shrink-0 text-right text-lg font-semibold tabular-nums text-[#f5f5f5]">
              {formatCurrency(row.cnyPrice, "CNY")}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs leading-5 text-[#8f8f8f]">
            <span>
              <strong className="font-semibold text-[#f5f5f5]">{row.countryLabel}</strong> {row.countryCode}
            </span>
            <span>{row.priceText} · {row.currencyCode}</span>
            <span>1 {row.currencyCode} ≈ {formatCurrency(row.fxRateToCny, "CNY")}</span>
            <span>{formatRelativeTime(row.fetchedAt)}</span>
          </div>
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex h-8 items-center gap-1.5 border border-white/16 px-3 text-xs font-semibold text-[#f5f5f5] transition hover:border-white/32 hover:bg-white/10"
          >
            App Store
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </article>
  );
}

function OfficialOfferTable({
  returnQuery,
  rows,
}: {
  returnQuery: string;
  rows: OfficialPriceOfferRow[];
}) {
  return (
    <section className="overflow-hidden border border-white/12 bg-[#0b0b0b]">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-white/12 bg-[#101010] font-mono text-[0.68rem] uppercase text-[#8f8f8f]">
            <tr>
              <TableHead>平台</TableHead>
              <TableHead>标准商品</TableHead>
              <TableHead>地区</TableHead>
              <TableHead>原价</TableHead>
              <TableHead>约合人民币</TableHead>
              <TableHead>汇率</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>数据源</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => {
              const href = officialDetailHref(`${row.appSlug}__${row.planSlug}`, returnQuery);

              return (
                <tr key={row.id} className="transition hover:bg-white/[0.035]">
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-[#f5f5f5]">
                      <BrandIcon platform={row.app.displayName} className="h-[17px] w-[17px]" />
                      {row.app.displayName}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    <Link
                      href={href}
                      prefetch={false}
                      onClick={listDetailClickHandler(href, returnQuery)}
                      className="block truncate font-semibold text-[#f5f5f5] hover:text-white"
                    >
                      {row.plan.label}
                    </Link>
                    <span className="mt-1 block text-xs text-[#8f8f8f]">{billingPeriodLabel(row.plan.billingPeriod)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-[#f5f5f5]">{row.countryLabel}</span>
                    <span className="ml-2 font-mono text-xs font-medium text-[#8f8f8f]">{row.countryCode}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-[#f5f5f5]">{row.priceText}</span>
                    <span className="ml-2 font-mono text-xs text-[#8f8f8f]">{row.currencyCode}</span>
                  </td>
                  <td className="px-5 py-4 text-lg font-semibold text-[#f5f5f5]">{formatCurrency(row.cnyPrice, "CNY")}</td>
                  <td className="px-5 py-4 font-mono text-[#8f8f8f]">
                    1 {row.currencyCode} ≈ {formatCurrency(row.fxRateToCny, "CNY")}
                  </td>
                  <td className="px-5 py-4 text-[#8f8f8f]">{formatRelativeTime(row.fetchedAt)}</td>
                  <td className="px-5 py-4">
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap border border-white/16 px-3 text-xs font-semibold text-[#f5f5f5] transition hover:border-white/32 hover:bg-white/10"
                    >
                      App Store
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ViewToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap px-3 text-sm font-semibold transition ${
        active
          ? "bg-[#f5f5f5] text-[#050505]"
          : "text-[#8f8f8f] hover:text-[#f5f5f5]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-white/12 bg-[#0b0b0b] px-6 py-16 text-center">
      <p className="text-2xl font-semibold text-[#f5f5f5]">{text}</p>
      <p className="mt-3 text-sm text-[#8f8f8f]">可以切换平台，或清空搜索条件后再查看。</p>
    </div>
  );
}

function TableHead({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`px-5 py-3 font-semibold tracking-normal ${className}`}>{children}</th>;
}

function billingPeriodLabel(period: OfficialPricePlanSummary["billingPeriod"]) {
  return period === "annual" ? "年付" : "月付";
}

function officialDetailHref(id: string, returnQuery: string): string {
  return listDetailHref(`/official-prices/${id}`, returnQuery);
}

function listDetailClickHandler(path: string, returnQuery: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (!shouldHandleListDetailClick(event)) return;
    event.preventDefault();
    saveCurrentListScrollPosition();
    window.location.assign(listDetailNavigationHref(path, returnQuery));
  };
}

function buildOfficialSearchParams({
  platform,
  query,
  scopeMode,
}: {
  platform: PlatformFilter;
  query: string;
  scopeMode: ScopeMode;
}): URLSearchParams {
  const params = new URLSearchParams();
  const normalizedQuery = query.trim();

  if (platform !== "all") params.set("platform", platform);
  if (scopeMode !== "products") params.set("scope", scopeMode);
  if (normalizedQuery) params.set("q", normalizedQuery);

  return params;
}

function parseOfficialInitialState(params: URLSearchParams, dataset: OfficialPricesDataset) {
  return {
    platform: pickOfficialPlatform(params.get("platform") || "", dataset),
    scopeMode: pickParam(params.get("scope") || "", officialScopeOptions, "products"),
    query: params.get("q") || "",
  };
}

function pickOfficialPlatform(value: string, dataset: OfficialPricesDataset): PlatformFilter {
  if (!value) return "all";
  if (value === "all") return "all";
  return dataset.apps.some((app) => app.slug === value) ? (value as OfficialPriceAppSlug) : "all";
}

function pickParam<T extends string>(value: string, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function matchesSummary(summary: OfficialPricePlanSummary, query: string) {
  if (!query) return true;

  return [
    summary.label,
    summary.platform,
    summary.provider,
    summary.lowestRow?.countryLabel,
    summary.lowestRow?.countryCode,
    summary.lowestRow?.priceText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function matchesOffer(row: OfficialPriceOfferRow, query: string) {
  if (!query) return true;

  return [
    row.app.displayName,
    row.app.provider,
    row.plan.label,
    row.countryLabel,
    row.countryCode,
    row.currencyCode,
    row.priceText,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function comparePrice(a: number | null | undefined, b: number | null | undefined) {
  if (typeof a !== "number" && typeof b !== "number") return 0;
  if (typeof a !== "number") return 1;
  if (typeof b !== "number") return -1;
  return a - b;
}
