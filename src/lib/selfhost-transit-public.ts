import "server-only";

import type {
  TransitAccountPool,
  TransitChannelType,
  TransitCommercialRelation,
  TransitDataStatus,
  TransitInvoiceSupport,
  TransitModelFamily,
  TransitModelPrice,
  TransitOperatorType,
  TransitRiskLabel,
  TransitSourceType,
  TransitStation,
  TransitStationStatus,
  TransitStationSystem,
  TransitUsageAdvice,
} from "@/data/api-transit/types";
import {
  isTransitModelFamily,
  isTransitStandardModel,
  isTransitStationSystem,
} from "@/data/api-transit/types";
import { getSelfHostedApiBaseUrl } from "@/lib/selfhost-api";

type SelfhostPublicStation = Record<string, unknown> & {
  offers?: SelfhostPublicOffer[];
};

type SelfhostPublicOffer = Record<string, unknown>;

type SelfhostStationsResponse = {
  ok?: boolean;
  stations?: SelfhostPublicStation[];
  station?: SelfhostPublicStation | null;
};

const READ_TIMEOUT_MS = 2_500;

export async function readTransitStationsFromSelfhost(): Promise<TransitStation[]> {
  const json = await readSelfhostPublicJson("/api/transit/stations");
  if (!json?.ok || !Array.isArray(json.stations)) return [];
  return json.stations.map(mapSelfhostStation).filter((station): station is TransitStation => Boolean(station));
}

export async function readTransitStationFromSelfhostBySlug(slug: string): Promise<TransitStation | undefined> {
  const json = await readSelfhostPublicJson(`/api/transit/stations/${encodeURIComponent(slug)}`);
  if (!json?.ok || !json.station) return undefined;
  return mapSelfhostStation(json.station) || undefined;
}

async function readSelfhostPublicJson(path: string): Promise<SelfhostStationsResponse | null> {
  let baseUrl: string;
  try {
    baseUrl = getSelfHostedApiBaseUrl();
  } catch {
    return null;
  }

  const response = await fetch(new URL(path, baseUrl), {
    cache: "no-store",
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  return response.json() as Promise<SelfhostStationsResponse>;
}

function mapSelfhostStation(row: SelfhostPublicStation): TransitStation | null {
  const id = text(row.id);
  const slug = text(row.slug);
  const name = text(row.name);
  const websiteUrl = text(row.websiteUrl);
  if (!id || !slug || !name || !websiteUrl) return null;

  const lastUpdatedAt = timestamp(row.lastUpdatedAt || row.updatedAt || row.createdAt);
  const sourceUrl = nullableText(row.monitorUrl) || nullableText(row.pricingUrl) || websiteUrl;
  const offers = Array.isArray(row.offers) ? row.offers : [];

  return {
    id,
    slug,
    name,
    websiteUrl,
    apiBaseUrl: nullableText(row.apiBaseUrl),
    logoUrl: nullableText(row.logoUrl),
    monitorUrl: nullableText(row.monitorUrl),
    stationSystem: stationSystem(row.stationSystem),
    operatorType: operatorType(row.operatorType),
    invoiceSupport: invoiceSupport(row.invoiceSupport),
    status: stationStatus(row.status),
    sourceType: sourceType(row.sourceType),
    commercialRelation: commercialRelation(row.commercialRelation),
    summary: text(row.summary) || `${name} 中转 API 渠道，后台发布后展示公开可核对的模型、倍率和渠道信息。`,
    channelTypes: enumArray(row.channelTypes, isTransitChannelType),
    accountPools: enumArray(row.accountPools, isTransitAccountPool),
    paymentMethods: textArray(row.paymentMethods),
    minimumTopUp: nullableText(row.minimumTopUp),
    balanceExpiry: nullableText(row.balanceExpiry),
    supportChannels: textArray(row.supportChannels),
    refundPolicy: nullableText(row.refundPolicy),
    riskLabels: enumArray(row.riskLabels, isTransitRiskLabel),
    usageAdvice: usageAdvice(row.usageAdvice),
    lastUpdatedAt,
    dataStatus: dataStatus(row.dataStatus),
    availability: {
      sevenDayRate: null,
      sevenDaySamples: 0,
      firstCheckedAt: null,
      lastCheckedAt: null,
      sourceType: "manual_snapshot",
      sourceLabel: "后台发布",
      sourceUrl,
    },
    prices: offers.map((offer) => mapSelfhostOffer(offer, sourceUrl)).filter((price): price is TransitModelPrice => Boolean(price)),
    feedback: {
      pendingCount: 0,
      verifiedRiskCount: 0,
      merchantRespondedCount: 0,
      mainThemes: [],
      publicNotes: null,
    },
    strengths: textArray(row.strengths),
    cautions: textArray(row.cautions),
    commercialOffers: [],
    verificationEvents: [],
  };
}

function mapSelfhostOffer(row: SelfhostPublicOffer, sourceUrl: string | null): TransitModelPrice | null {
  const family = modelFamily(row.family);
  const standardModel = text(row.standardModel);
  if (!family || !isTransitStandardModel(standardModel)) return null;
  const lastVerifiedAt = timestamp(row.lastVerifiedAt || row.updatedAt || row.createdAt);

  return {
    family,
    standardModel,
    groupName: text(row.groupName) || "默认分组",
    rechargeRatio: nullableText(row.rechargeRatio),
    billingMode: billingMode(row.billingMode),
    modelMultiplier: numberValue(row.modelMultiplier),
    inputPrice: numberValue(row.inputPrice),
    outputPrice: numberValue(row.outputPrice),
    cacheReadPrice: numberValue(row.cacheReadPrice),
    cacheWritePrice: numberValue(row.cacheWritePrice),
    imageOutputPrice: numberValue(row.imageOutputPrice),
    fixedPrice: numberValue(row.fixedPrice),
    fixedPriceCurrency: nullableText(row.fixedPriceCurrency) === "CNY" ? "CNY" : null,
    fixedPriceUnit: nullableText(row.fixedPriceUnit),
    fixedPriceTiers: [],
    currency: "CNY",
    accountPool: accountPool(row.accountPool),
    channelType: channelType(row.channelType),
    priceSource: text(row.priceSource) || "后台手动录入",
    lastVerifiedAt,
    availability: {
      sevenDayRate: null,
      sevenDaySamples: 0,
      firstCheckedAt: null,
      lastCheckedAt: null,
      sourceType: "manual_snapshot",
      sourceLabel: "后台发布",
      sourceUrl,
    },
    history: [],
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function nullableText(value: unknown): string | null {
  const valueText = text(value);
  return valueText ? valueText : null;
}

function textArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value === "string") return value.split(/[\n,，/|]+/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function enumArray<T extends string>(value: unknown, guard: (value: string) => value is T): T[] {
  return textArray(value).filter(guard);
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function timestamp(value: unknown): string {
  return nullableText(value) || new Date().toISOString();
}

function stationStatus(value: unknown): TransitStationStatus {
  const valueText = text(value);
  if (valueText === "active") return "active";
  if (valueText === "risky" || valueText === "limited") return "limited";
  if (valueText === "inactive" || valueText === "unavailable") return "unavailable";
  return "unknown";
}

function sourceType(value: unknown): TransitSourceType {
  const valueText = text(value);
  if (valueText === "user_submitted" || valueText === "merchant_submitted") return valueText;
  return "manual_collected";
}

function commercialRelation(value: unknown): TransitCommercialRelation {
  const valueText = text(value);
  if (valueText === "none" || valueText === "partner" || valueText === "listed" || valueText === "affiliate" || valueText === "sponsored" || valueText === "unknown") return valueText;
  if (valueText === "sponsor") return "sponsored";
  return "unknown";
}

function usageAdvice(value: unknown): TransitUsageAdvice {
  const valueText = text(value);
  if (valueText === "try_small" || valueText === "trial_only" || valueText === "normal") return "try_small";
  if (valueText === "cautious") return "cautious";
  if (valueText === "not_recommended" || valueText === "avoid") return "not_recommended";
  return "pending";
}

function dataStatus(value: unknown): TransitDataStatus {
  const valueText = text(value);
  if (valueText === "sample" || valueText === "verified") return valueText;
  return "pending_review";
}

function modelFamily(value: unknown): TransitModelFamily | null {
  const valueText = text(value);
  return isTransitModelFamily(valueText) ? valueText : null;
}

function stationSystem(value: unknown): TransitStationSystem {
  const valueText = text(value);
  return isTransitStationSystem(valueText) ? valueText : "unknown";
}

function operatorType(value: unknown): TransitOperatorType {
  const valueText = text(value);
  return valueText === "company" || valueText === "individual" || valueText === "unknown" ? valueText : "unknown";
}

function invoiceSupport(value: unknown): TransitInvoiceSupport {
  const valueText = text(value);
  return valueText === "supported" || valueText === "unsupported" || valueText === "unknown" ? valueText : "unknown";
}

function accountPool(value: unknown): TransitAccountPool {
  const valueText = text(value);
  return isTransitAccountPool(valueText) ? valueText : "undisclosed";
}

function channelType(value: unknown): TransitChannelType {
  const valueText = text(value);
  return isTransitChannelType(valueText) ? valueText : "undisclosed";
}

function billingMode(value: unknown): TransitModelPrice["billingMode"] {
  const valueText = text(value);
  return valueText === "token" || valueText === "per_request" || valueText === "fixed" ? valueText : null;
}

function isTransitChannelType(value: string): value is TransitChannelType {
  return [
    "official_api",
    "cloud",
    "first_party_pool",
    "reverse_engineered",
    "first_party_wholesale",
    "reseller",
    "mixed",
    "undisclosed",
  ].includes(value);
}

function isTransitAccountPool(value: string): value is TransitAccountPool {
  return ["pro", "plus", "max", "team", "kiro", "enterprise", "official_api", "mixed", "undisclosed"].includes(value);
}

function isTransitRiskLabel(value: string): value is TransitRiskLabel {
  return [
    "sample_data",
    "insufficient_samples",
    "mixed_pool",
    "reseller",
    "undisclosed_upstream",
    "third_party_aggregate",
    "pending_feedback",
  ].includes(value);
}
