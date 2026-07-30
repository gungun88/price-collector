import type { Metadata } from "next";
import { Clock3, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReturnToListLink } from "@/components/ReturnToListLink";
import { SiteHeader } from "@/components/SiteHeader";
import {
  apiProviderTypeLabels,
  formatApiDisplayText,
  formatApiPrice,
  getApiBenchmarkPriceLabels,
  formatPlanPriceFrom,
  getPlanMonthlyPriceCny,
  getApiModelOffersByProvider,
  getApiPlansByProvider,
  getApiProviderSummary,
  type ApiCurrency,
  type ApiModelOfferWithRelations,
  type ApiPlan,
  type ApiProviderType,
} from "@/lib/api-models";
import { getApiModelDataset } from "@/lib/api-models-db";
import { formatDateDay } from "@/lib/utils";

export const dynamicParams = true;
export const revalidate = 300;

const API_MODELS_RETURN_KEYS = ["family", "scope", "q", "type", "currency", "sort"] as const;

export async function generateStaticParams() {
  const dataset = await getApiModelDataset();
  return dataset.providers.map((provider) => ({
    id: provider.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dataset = await getApiModelDataset();
  const summary = getApiProviderSummary(id, dataset);

  if (!summary) {
    return {
      title: "API 渠道详情",
    };
  }

  return {
    title: `${summary.provider.name} 模型覆盖`,
    description: `查看 ${summary.provider.name} 覆盖的 API 模型、Token Plan、价格和限制。`,
    alternates: {
      canonical: `/official-api/providers/${id}`,
    },
    openGraph: {
      title: `${summary.provider.name} 模型覆盖`,
      description: `对比 ${summary.provider.name} 的公开模型、Token Plan 和限制。`,
      url: `https://priceai.cc/official-api/providers/${id}`,
    },
  };
}

export default async function ApiProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = await getApiModelDataset();
  const summary = getApiProviderSummary(id, dataset);
  const currency: ApiCurrency = "CNY";

  if (!summary) notFound();

  const provider = summary.provider;
  const rows = getApiModelOffersByProvider(id, dataset);
  const plans = getApiPlansByProvider(id, dataset);
  const planRows = rows.length ? [] : [...plans].sort(compareApiPlansByMonthlyPrice);
  const detailCount = rows.length + planRows.length;

  return (
    <main className="priceai-square-ui min-h-screen bg-[#050505] text-[#f5f5f5]">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
        <SiteHeader logoCompact activeSection="api" maxWidthClassName="max-w-[1500px]" variant="dark" />
      </div>

      <div className="mx-auto max-w-[1500px] px-5 pb-10 pt-4 sm:px-8 md:pb-14 md:pt-6">
        <div className="mb-5">
          <ReturnToListLink
            allowedKeys={API_MODELS_RETURN_KEYS}
            basePath="/official-api"
            label="返回官方 API"
          />
        </div>

        <section className="mt-5">
          <div className="flex flex-col gap-3 border-b border-white/12 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-normal text-[#f7f7f7]">{provider.name}</h1>
            <p className="mt-2 text-sm text-[#a3a3a3]">
              {detailCount} 条公开渠道信息 · 人民币展示，汇率日期 {dataset.fxSummary.date}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#a3a3a3]">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <Clock3 size={16} />
              最近记录 {formatDatasetDate(summary.latestUpdatedAt)}
            </span>
            <a
              href={provider.pricingUrl ?? provider.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 border border-white/12 bg-white/5 px-3 text-xs font-semibold text-[#f5f5f5] transition hover:border-white/24 hover:bg-white/10"
            >
              查看来源
              <ExternalLink size={13} />
            </a>
          </div>
          </div>

        <ApiOfferMobileList rows={rows} currency={currency} />
        <ApiPlanMobileList plans={planRows} currency={currency} />

        <section className="mt-5 hidden overflow-hidden bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15 md:block">
          <div className="overflow-x-auto">
            <table className="min-w-[940px] w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[30%]" />
                <col className="w-[27%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead className="bg-[#f2f4f4] text-[0.68rem] font-semibold text-[#5a6061]">
                <tr>
                  <TableHead>模型</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>额度与限制</TableHead>
                  <TableHead>来源链接</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f1]">
                {rows.map((offer) => (
                  <ApiOfferRow key={offer.id} offer={offer} currency={currency} />
                ))}
                {planRows.map((plan) => (
                  <ApiPlanRow key={plan.id} plan={plan} currency={currency} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </section>
      </div>
    </main>
  );
}

function ApiOfferMobileList({ rows, currency }: { rows: ApiModelOfferWithRelations[]; currency: ApiCurrency }) {
  return (
    <section className="mt-5 grid grid-cols-1 gap-3 md:hidden">
      {rows.map((offer) => {
        const sourceHref = offer.pricingUrl ?? offer.provider.pricingUrl ?? offer.provider.url;
        const priceLabels = getApiBenchmarkPriceLabels(offer.model.family);

        return (
          <article key={offer.id} className="bg-white p-4 shadow-[0_16px_45px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/official-api/${offer.modelId}`} className="block truncate text-base font-bold leading-6 text-[#202829]">
                  {offer.model.displayName}
                </Link>
                <p className="mt-0.5 text-sm text-[#5a6061]">{offer.model.family}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5a6061]">调用：{offer.routeModelId ?? offer.model.modelId}</p>
              </div>
              <TypeChip type={offer.provider.type} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <PriceMetric label={priceLabels.input} value={formatApiPrice(offer.inputPrice, currency)} />
              <PriceMetric label={priceLabels.output} value={formatApiPrice(offer.outputPrice, currency)} />
            </div>
            <div className="mt-2">
              <PriceMetric
                label={priceLabels.cacheRead}
                value={formatCacheApiPrice(offer.cacheReadPrice, currency)}
                helper={offer.cacheWritePrice ? `${priceLabels.cacheWrite}：${formatCacheApiPrice(offer.cacheWritePrice, currency)}` : undefined}
              />
            </div>

            <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-[#2d3435]">{formatApiDisplayText(offer.freeOrPlan)}</p>
            {offer.notes ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5a6061]">{formatApiDisplayText(offer.notes)}</p> : null}
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5a6061]">{formatApiDisplayText(offer.limitSummary)}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={sourceHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 max-w-full items-center gap-1.5 bg-[#e4e9ea] px-3 text-xs font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
              >
                <span className="truncate">查看来源</span>
                <ExternalLink size={13} className="shrink-0" />
              </a>
              <span className="text-xs text-[#5a6061]">{formatDatasetDate(offer.updatedAt)}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function ApiPlanMobileList({ plans, currency }: { plans: ApiPlan[]; currency: ApiCurrency }) {
  if (!plans.length) return null;

  return (
    <section className="mt-5 grid grid-cols-1 gap-3 md:hidden">
      {plans.map((plan) => (
        <article key={plan.id} className="bg-white p-4 shadow-[0_16px_45px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold leading-6 text-[#202829]">{plan.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#5a6061]">{formatApiDisplayText(plan.coverageLabel || plan.modelIds.join("、") || "模型覆盖以官方页面为准")}</p>
            </div>
            <TypeChip type={plan.type} />
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#202829]">{formatPlanPriceFrom(plan, currency)}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#5a6061]">{formatApiDisplayText(plan.quotaSummary)}</p>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#5a6061]">{formatApiDisplayText(plan.limitSummary)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={plan.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 max-w-full items-center gap-1.5 bg-[#e4e9ea] px-3 text-xs font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
            >
              <span className="truncate">查看来源</span>
              <ExternalLink size={13} className="shrink-0" />
            </a>
            <span className="text-xs text-[#5a6061]">{formatDatasetDate(plan.updatedAt)}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function ApiOfferRow({ offer, currency }: { offer: ApiModelOfferWithRelations; currency: ApiCurrency }) {
  const sourceHref = offer.pricingUrl ?? offer.provider.pricingUrl ?? offer.provider.url;
  const priceLabels = getApiBenchmarkPriceLabels(offer.model.family);

  return (
    <tr className="align-top transition hover:bg-[#f7f9f9]">
      <td className="px-5 py-4">
        <Link href={`/official-api/${offer.modelId}`} className="block truncate font-semibold leading-6 text-[#202829] hover:text-[#2f7a4b]">
          {offer.model.displayName}
        </Link>
        <p className="mt-1 text-xs font-medium text-[#5a6061]">{offer.model.family}</p>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#5a6061]">调用：{offer.routeModelId ?? offer.model.modelId}</p>
      </td>
      <td className="px-5 py-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <PriceMetric label={priceLabels.input} value={formatApiPrice(offer.inputPrice, currency)} />
          <PriceMetric label={priceLabels.output} value={formatApiPrice(offer.outputPrice, currency)} />
          <PriceMetric
            label={priceLabels.cacheRead}
            value={formatCacheApiPrice(offer.cacheReadPrice, currency)}
            helper={offer.cacheWritePrice ? `${priceLabels.cacheWrite}：${formatCacheApiPrice(offer.cacheWritePrice, currency)}` : undefined}
          />
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="line-clamp-2 text-sm font-medium leading-6 text-[#2d3435]">{formatApiDisplayText(offer.freeOrPlan)}</p>
        {offer.notes ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5a6061]">{formatApiDisplayText(offer.notes)}</p> : null}
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5a6061]">{formatApiDisplayText(offer.limitSummary)}</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <a
            href={sourceHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 bg-[#e4e9ea] px-3 py-2 text-xs font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
          >
            <span className="truncate">查看来源</span>
            <ExternalLink size={13} className="shrink-0" />
          </a>
          <span className="text-xs font-medium text-[#5a6061]">{formatDatasetDate(offer.updatedAt)}</span>
        </div>
      </td>
    </tr>
  );
}

function ApiPlanRow({ plan, currency }: { plan: ApiPlan; currency: ApiCurrency }) {
  return (
    <tr className="align-top transition hover:bg-[#f7f9f9]">
      <td className="px-5 py-4">
        <p className="block truncate font-semibold leading-6 text-[#202829]">{plan.name}</p>
        <p className="mt-1 text-xs font-medium text-[#5a6061]">{formatApiDisplayText(plan.coverageLabel || plan.modelIds.join("、") || "模型覆盖以官方页面为准")}</p>
      </td>
      <td className="px-5 py-4">
        <p className="font-semibold leading-6 text-[#202829]">{formatPlanPriceFrom(plan, currency)}</p>
        <p className="mt-1 text-xs leading-5 text-[#5a6061]">{formatApiDisplayText(plan.resetSummary)}</p>
      </td>
      <td className="px-5 py-4">
        <p className="line-clamp-3 text-sm font-medium leading-6 text-[#2d3435]">{formatApiDisplayText(plan.quotaSummary)}</p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#5a6061]">{formatApiDisplayText(plan.limitSummary)}</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <a
            href={plan.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 bg-[#e4e9ea] px-3 py-2 text-xs font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
          >
            <span className="truncate">查看来源</span>
            <ExternalLink size={13} className="shrink-0" />
          </a>
          <span className="text-xs font-medium text-[#5a6061]">{formatDatasetDate(plan.updatedAt)}</span>
        </div>
      </td>
    </tr>
  );
}

function compareApiPlansByMonthlyPrice(a: ApiPlan, b: ApiPlan) {
  const aPrice = getPlanMonthlyPriceCny(a);
  const bPrice = getPlanMonthlyPriceCny(b);
  if (aPrice === null && bPrice === null) return a.name.localeCompare(b.name, "zh-CN");
  if (aPrice === null) return 1;
  if (bPrice === null) return -1;
  return aPrice - bPrice || a.name.localeCompare(b.name, "zh-CN");
}

function TypeChip({ type }: { type: ApiProviderType }) {
  const classNameByType: Record<ApiProviderType, string> = {
    official: "bg-[#e8f3ec] text-[#2f7a4b]",
    subscription: "bg-[#e4e9ea] text-[#2d3435]",
    router: "bg-[#eef3f8] text-[#47657a]",
    free: "bg-[#fff7e8] text-[#7a541b]",
  };

  return (
    <span className={`inline-flex h-8 items-center whitespace-nowrap px-3 text-xs font-semibold ${classNameByType[type]}`}>
      {apiProviderTypeLabels[type]}
    </span>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 font-semibold">{children}</th>;
}

function PriceMetric({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="min-w-0 bg-[#f7f9f9] px-3 py-2 ring-1 ring-[#adb3b4]/10">
      <p className="text-[0.68rem] font-semibold text-[#5a6061]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-5 text-[#202829]">{value}</p>
      {helper ? <p className="mt-1 break-words text-xs leading-5 text-[#5a6061]">{helper}</p> : null}
    </div>
  );
}

function formatCacheApiPrice(price: ApiModelOfferWithRelations["cacheReadPrice"], currency: ApiCurrency) {
  return price ? formatApiPrice(price, currency, { maximumFractionDigits: 3 }) : "-";
}

function formatDatasetDate(value: string) {
  return formatDateDay(value);
}
