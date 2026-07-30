import "server-only";

import {
  officialPriceApps,
  officialPriceGeneratedAt,
  officialPricePlans,
  staticOfficialPricesDataset,
  type OfficialPricesDataset,
} from "@/lib/official-prices";
import officialRegionConfig from "../../config/official-prices/regions.json";
import type {
  OfficialSubscriptionAdminApp,
  OfficialSubscriptionAdminData,
  OfficialSubscriptionAdminPlan,
  OfficialSubscriptionAdminPrice,
  OfficialSubscriptionAdminRegion,
} from "@/lib/types";

type OfficialRegionConfigRow = {
  countryCode: string;
  countryLabel: string;
  storefrontCode: string;
  currencyCode: string;
  enabled?: boolean;
  priority?: number;
};

const OFFICIAL_PRICE_CACHE_TTL_MS = 30_000;

let officialPriceCache: { expiresAt: number; value: OfficialPricesDataset } | null = null;
let officialPricePromise: Promise<OfficialPricesDataset> | null = null;

export function clearOfficialPricesCache() {
  officialPriceCache = null;
  officialPricePromise = null;
}

export async function getOfficialPricesDataset(): Promise<OfficialPricesDataset> {
  const now = Date.now();
  if (officialPriceCache && officialPriceCache.expiresAt > now) return officialPriceCache.value;
  if (officialPricePromise) return officialPricePromise;

  const dataset: OfficialPricesDataset = {
    ...staticOfficialPricesDataset,
    configured: true,
    source: "static",
  };

  officialPricePromise = Promise.resolve(dataset).then((value) => {
    officialPriceCache = {
      expiresAt: Date.now() + OFFICIAL_PRICE_CACHE_TTL_MS,
      value,
    };
    return value;
  }).finally(() => {
    officialPricePromise = null;
  });

  return officialPricePromise;
}

export async function getOfficialSubscriptionAdminData(): Promise<OfficialSubscriptionAdminData> {
  return buildStaticOfficialAdminData({
    configured: true,
    message: "当前自托管版本暂未接入官方地区价后台维护，页面展示静态官方地区价样本。",
  });
}

function buildStaticOfficialAdminData({
  configured,
  message,
}: {
  configured: boolean;
  message: string;
}): OfficialSubscriptionAdminData {
  const apps: OfficialSubscriptionAdminApp[] = officialPriceApps.map((app, index) => ({
    id: app.slug,
    slug: app.slug,
    displayName: app.displayName,
    provider: app.provider,
    appStoreId: app.appStoreId,
    appStoreSlug: app.appStoreSlug,
    enabled: true,
    sortOrder: (index + 1) * 10,
  }));
  const appBySlug = new Map(apps.map((app) => [app.slug, app]));
  const plans: OfficialSubscriptionAdminPlan[] = officialPricePlans.map((plan, index) => ({
    id: `${plan.appSlug}/${plan.slug}`,
    appId: plan.appSlug,
    appSlug: plan.appSlug,
    slug: plan.slug,
    label: plan.label,
    billingPeriod: plan.billingPeriod,
    enabled: true,
    sortOrder: (index + 1) * 10,
  }));
  const regions = staticOfficialAdminRegions();

  const currentPrices: OfficialSubscriptionAdminPrice[] = staticOfficialPricesDataset.rows.map((row, index) => {
    const app = appBySlug.get(row.appSlug);
    const plan = plans.find((item) => item.appSlug === row.appSlug && item.slug === row.planSlug);
    return {
      id: `static-${index}`,
      appSlug: row.appSlug,
      appName: app?.displayName || row.appSlug,
      planSlug: row.planSlug,
      planLabel: plan?.label || row.planSlug,
      billingPeriod: plan?.billingPeriod || "monthly",
      countryCode: row.countryCode,
      countryLabel: row.countryLabel,
      currencyCode: row.currencyCode,
      priceText: row.priceText,
      priceValue: row.priceValue,
      cnyPrice: row.cnyPrice,
      fxRateToCny: row.fxRateToCny,
      fxDate: row.fxDate,
      sourceUrl: row.sourceUrl,
      status: "available",
      rawTitle: null,
      lastSuccessAt: row.fetchedAt,
      lastCheckedAt: row.fetchedAt,
      failureReason: null,
    };
  });

  return {
    configured,
    tableReady: false,
    source: "static",
    generatedAt: officialPriceGeneratedAt,
    message,
    apps,
    plans,
    regions,
    currentPrices,
    collectRuns: [],
    unmatchedItems: [],
  };
}

function staticOfficialAdminRegions(): OfficialSubscriptionAdminRegion[] {
  const configuredRegions = (officialRegionConfig as OfficialRegionConfigRow[])
    .filter((region) => region.enabled !== false)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
    .map((region, index): OfficialSubscriptionAdminRegion => ({
      id: region.countryCode,
      countryCode: region.countryCode,
      storefrontCode: region.storefrontCode,
      countryLabel: region.countryLabel,
      currencyCode: region.currencyCode,
      enabled: true,
      priority: region.priority || (index + 1) * 10,
    }));

  if (configuredRegions.length) return configuredRegions;

  const regionByCode = new Map<string, OfficialSubscriptionAdminRegion>();
  for (const row of staticOfficialPricesDataset.rows) {
    if (regionByCode.has(row.countryCode)) continue;
    regionByCode.set(row.countryCode, {
      id: row.countryCode,
      countryCode: row.countryCode,
      storefrontCode: row.countryCode.toLowerCase(),
      countryLabel: row.countryLabel,
      currencyCode: row.currencyCode,
      enabled: true,
      priority: regionByCode.size * 10 + 10,
    });
  }
  return Array.from(regionByCode.values());
}
