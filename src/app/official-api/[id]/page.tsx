import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import {
  formatApiPrice,
  formatPlanPriceFrom,
  getApiBenchmarkPriceLabels,
  getApiModelOffersByModel,
  getApiModelSummary,
  getPlanMonthlyPriceCny,
  getApiPlansByModel,
  type ApiCurrency,
  type ApiPlan,
} from "@/lib/api-models";
import { getApiModelDataset } from "@/lib/api-models-db";
import { formatDateDay } from "@/lib/utils";

export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  const dataset = await getApiModelDataset();
  return dataset.models.map((model) => ({
    id: model.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dataset = await getApiModelDataset();
  const summary = getApiModelSummary(id, dataset);

  if (!summary) return { title: "官方接口详情" };

  return {
    title: `${summary.displayName} 官方接口`,
    description: `${summary.displayName} 的官方接口、计费方式和来源链接。`,
    alternates: {
      canonical: `/official-api/${id}`,
    },
  };
}

export default async function ApiModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = await getApiModelDataset();
  const summary = getApiModelSummary(id, dataset);
  const currency: ApiCurrency = "CNY";

  if (!summary) notFound();

  const offerRows = getApiModelOffersByModel(id, dataset);
  const planRows = getApiPlansByModel(id, dataset)
    .filter((plan) => !offerRows.some((offer) => offer.providerId === plan.providerId))
    .sort(comparePlans);

  const rows = [
    ...offerRows.map((offer) => ({
      id: offer.id,
      provider: offer.provider.name,
      href: offer.pricingUrl ?? offer.provider.pricingUrl ?? offer.provider.url,
      kind: offer.provider.type === "official" ? "官方" : "渠道",
      price: getOfferPriceText(summary.family, offer, currency),
      detail: offer.freeOrPlan || "按量计费",
      updatedAt: offer.updatedAt,
    })),
    ...planRows.map((plan) => ({
      id: plan.id,
      provider: plan.providerName,
      href: plan.url,
      kind: plan.type === "official" ? "官方" : "套餐",
      price: formatPlanPriceFrom(plan, currency),
      detail: plan.quotaSummary || "套餐额度",
      updatedAt: plan.updatedAt,
    })),
  ];

  return (
    <main className="min-h-screen bg-[var(--color-page)] text-[var(--color-text-body)]">
      <SiteHeader activeSection="api" maxWidthClassName="max-w-6xl" />

      <div className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/official-api"
          className="inline-flex items-center gap-2 font-mono text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={14} />
          返回官方接口
        </Link>

        <section className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="min-w-0">
            <p className="font-mono text-sm text-[var(--color-text-soft)]">{summary.family} / 官方接口</p>
            <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold leading-none tracking-normal text-[var(--color-text-primary)] sm:text-6xl">
              {summary.displayName}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{summary.model.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-[var(--color-border-soft)] py-5 font-mono text-sm">
            <Metric label="来源" value={`${summary.providerCount}`} />
            <Metric label="官方" value={`${summary.officialCount}`} />
            <Metric label="免费" value={`${summary.freeCount}`} />
            <Metric label="更新" value={formatDateDay(summary.latestUpdatedAt)} />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border-soft)] pb-3">
            <h2 className="font-mono text-sm font-medium text-[var(--color-text-primary)]">接口来源</h2>
            <span className="font-mono text-sm text-[var(--color-text-soft)]">{rows.length} 条</span>
          </div>

          <div className="overflow-hidden">
            <div className="grid grid-cols-[44px_minmax(0,1.2fr)_minmax(0,1fr)_150px_32px] gap-3 border-b border-[var(--color-border-soft)] py-3 font-mono text-xs text-[var(--color-text-soft)] max-sm:grid-cols-[32px_minmax(0,1fr)_32px]">
              <span>#</span>
              <span>来源</span>
              <span className="max-sm:hidden">说明</span>
              <span className="max-sm:hidden">价格</span>
              <span />
            </div>

            {rows.map((row, index) => (
              <a
                key={row.id}
                href={row.href}
                target="_blank"
                rel="noreferrer"
                className="group grid grid-cols-[44px_minmax(0,1.2fr)_minmax(0,1fr)_150px_32px] gap-3 border-b border-[var(--color-border-soft)] py-4 text-sm text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] max-sm:grid-cols-[32px_minmax(0,1fr)_32px]"
              >
                <span className="font-mono text-xs text-[var(--color-text-soft)]">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[var(--color-text-primary)]">{row.provider}</span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-[var(--color-text-soft)]">
                    {row.kind} / {formatDateDay(row.updatedAt)}
                  </span>
                </span>
                <span className="truncate font-mono text-xs text-[var(--color-text-soft)] max-sm:hidden">{row.detail}</span>
                <span className="truncate font-mono text-xs text-[var(--color-text-soft)] max-sm:hidden">{row.price}</span>
                <ArrowRight
                  size={14}
                  className="self-center justify-self-end text-[var(--color-text-soft)] transition group-hover:text-[var(--color-text-primary)]"
                />
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function getOfferPriceText(
  family: string,
  offer: ReturnType<typeof getApiModelOffersByModel>[number],
  currency: ApiCurrency,
) {
  const labels = getApiBenchmarkPriceLabels(family);
  return `${labels.input} ${formatApiPrice(offer.inputPrice, currency)}`;
}

function comparePlans(a: ApiPlan, b: ApiPlan) {
  const aPrice = getPlanMonthlyPriceCny(a);
  const bPrice = getPlanMonthlyPriceCny(b);
  if (aPrice === null && bPrice === null) return a.name.localeCompare(b.name, "zh-CN");
  if (aPrice === null) return 1;
  if (bPrice === null) return -1;
  return aPrice - bPrice;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[var(--color-text-soft)]">{label}</p>
      <p className="mt-1 truncate text-base text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}
