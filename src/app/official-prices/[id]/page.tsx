import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";
import {
  buildOfficialPricePlanSummaries,
  getOfficialPricePlanSummaryFromDataset,
  getOfficialPriceRowsByIdFromDataset,
  type OfficialPricePlanSummary,
  type OfficialPriceRow,
} from "@/lib/official-prices";
import { getOfficialPricesDataset } from "@/lib/official-prices-db";
import { sanitizeListReturnHref } from "@/lib/list-return";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

const officialReturnKeys = ["platform", "scope", "q"] as const;

export async function generateStaticParams() {
  const dataset = await getOfficialPricesDataset();
  return buildOfficialPricePlanSummaries(dataset, "all").map((summary) => ({
    id: summary.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dataset = await getOfficialPricesDataset();
  const summary = getOfficialPricePlanSummaryFromDataset(dataset, id);

  if (!summary) return { title: "官方订阅详情" };

  return {
    title: `${summary.label} 官方地区价`,
    description: `查看 ${summary.label} 在不同 App Store 地区的公开订阅价格、人民币估算价、汇率和数据源。`,
    alternates: {
      canonical: `/official-prices/${id}`,
    },
  };
}

export default async function OfficialPriceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ back?: string }>;
}) {
  const { id } = await params;
  const back = (await searchParams)?.back;
  const dataset = await getOfficialPricesDataset();
  const summary = getOfficialPricePlanSummaryFromDataset(dataset, id);
  const rows = getOfficialPriceRowsByIdFromDataset(dataset, id).sort((a, b) => a.cnyPrice - b.cnyPrice);

  if (!summary) notFound();

  const returnHref = sanitizeListReturnHref("/official-prices", back, officialReturnKeys);
  const jsonLd = buildOfficialPriceDetailJsonLd(summary, rows);

  return (
    <div className="priceai-square-ui min-h-screen bg-[#050505] text-[#f5f5f5]">
      <JsonLd data={jsonLd} />
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
        <SiteHeader activeSection="official" maxWidthClassName="max-w-[1500px]" variant="dark" />
      </div>

      <main className="mx-auto w-full max-w-[1500px] px-5 pb-12 pt-5 sm:px-8 md:pt-7">
        <Link
          href={returnHref}
          className="inline-flex h-9 items-center gap-2 border border-white/14 px-3 font-mono text-xs uppercase tracking-normal text-[#8f8f8f] transition hover:border-white/32 hover:bg-white/10 hover:text-[#f5f5f5]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          返回官方地区价
        </Link>

        <section className="mt-6">
          <div className="flex flex-col gap-3 border-b border-white/12 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal text-[#f5f5f5] md:text-3xl">地区报价表</h2>
              <p className="mt-2 text-sm text-[#8f8f8f]">
                {rows.length} 条公开地区价格，按折算人民币从低到高排序。
              </p>
            </div>
            <p className="font-mono text-xs text-[#8f8f8f]">
              最近记录 {summary.latestFetchedAt ? formatRelativeTime(summary.latestFetchedAt) : "暂无"}
            </p>
          </div>

          <OfficialPriceRegionMobileList rows={rows} />
          <OfficialPriceRegionTable rows={rows} />
        </section>

      </main>
    </div>
  );
}

function OfficialPriceRegionMobileList({ rows }: { rows: OfficialPriceRow[] }) {
  return (
    <section className="mt-4 grid gap-3 md:hidden">
      {rows.map((row) => (
        <article key={`${row.appSlug}-${row.planSlug}-${row.countryCode}`} className="border border-white/12 bg-[#0b0b0b] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[#f5f5f5]">{row.countryLabel}</p>
              <p className="mt-1 font-mono text-xs text-[#8f8f8f]">{row.countryCode}</p>
            </div>
            <p className="shrink-0 text-right text-lg font-semibold tabular-nums text-[#f5f5f5]">
              {formatCurrency(row.cnyPrice, "CNY")}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs leading-5 text-[#8f8f8f]">
            <span>{row.priceText}</span>
            <span>{row.currencyCode}</span>
            <span>{formatFxRate(row)}</span>
            <span>{formatRelativeTime(row.fetchedAt)}</span>
          </div>
          <SourceLink href={row.sourceUrl} className="mt-3" />
        </article>
      ))}
    </section>
  );
}

function OfficialPriceRegionTable({ rows }: { rows: OfficialPriceRow[] }) {
  return (
    <section className="mt-4 hidden overflow-hidden border border-white/12 bg-[#0b0b0b] md:block">
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="border-b border-white/12 bg-[#101010] font-mono text-[0.68rem] uppercase text-[#8f8f8f]">
            <tr>
              <TableHead>地区</TableHead>
              <TableHead>原价</TableHead>
              <TableHead>约合人民币</TableHead>
              <TableHead>汇率</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>数据源</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => (
              <tr key={`${row.appSlug}-${row.planSlug}-${row.countryCode}`} className="transition hover:bg-white/[0.035]">
                <td className="px-5 py-4">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#f5f5f5]">{row.countryLabel}</div>
                    <div className="mt-1 truncate font-mono text-[11px] text-[#8f8f8f]">{row.countryCode}</div>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-[#d9d9d9]">
                  <div>{row.priceText}</div>
                  <div className="mt-1 text-[11px] text-[#8f8f8f]">{row.currencyCode}</div>
                </td>
                <td className="px-5 py-4 text-lg font-semibold tabular-nums text-[#f5f5f5]">
                  {formatCurrency(row.cnyPrice, "CNY")}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-[#8f8f8f]">{formatFxRate(row)}</td>
                <td className="px-5 py-4 font-mono text-xs text-[#8f8f8f]">{formatRelativeTime(row.fetchedAt)}</td>
                <td className="px-5 py-4">
                  <SourceLink href={row.sourceUrl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SourceLink({ href, className = "" }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap border border-white/16 px-3 text-xs font-semibold text-[#f5f5f5] transition hover:border-white/32 hover:bg-white/10 ${className}`}
    >
      App Store
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 font-semibold tracking-normal">{children}</th>;
}

function formatFxRate(row: OfficialPriceRow) {
  return `1 ${row.currencyCode} ≈ ${formatCurrency(row.fxRateToCny, "CNY")}`;
}

function buildOfficialPriceDetailJsonLd(summary: OfficialPricePlanSummary, rows: OfficialPriceRow[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: summary.label,
    brand: summary.provider,
    category: "AI subscription",
    offers: rows.slice(0, 20).map((row) => ({
      "@type": "Offer",
      priceCurrency: "CNY",
      price: row.cnyPrice,
      areaServed: row.countryCode,
      url: row.sourceUrl,
      availability: "https://schema.org/InStock",
    })),
  };
}
