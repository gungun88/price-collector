import "server-only";

import {
  buildProductGroups,
  canonicalCatalog,
  compareOffers,
  isAvailable,
  publicCatalogProducts,
  resolveOfferProduct,
} from "./catalog";
import {
  buildOfferFilterFacets,
  deriveOfferFilterTags,
  filterOfferFilterFacetsForProduct,
  offerMatchesFilterTags,
  parseOfferFilterTagsForProduct,
  type OfferFilterTagFacet,
  type OfferFilterTagId,
} from "./offer-filter-tags";
import {
  merchantCollectorFilterMatchesSource,
  merchantCollectorGroup,
  merchantCollectorLabel,
  merchantSourcePlatform,
} from "./merchant-collectors";
import {
  normalizePublicOfferLimit,
  normalizePublicOfferOffset,
  normalizePublicOfferQuery,
} from "./public-offer-query";
import { seedRawOffers, seedSources } from "./sample-data";
import type {
  CanonicalProduct,
  ExplorerData,
  ExplorerProductSummary,
  MerchantCollectorFilter,
  PublicMerchantSummary,
  PublicOfferSummary,
  RawOffer,
  Source,
} from "./types";
import { stableId } from "./utils";

export type PublicProductOffersResult = {
  offers: RawOffer[];
  total: number;
  filterFacets: OfferFilterTagFacet[];
  activeFilterTags: OfferFilterTagId[];
  limited?: boolean;
  generatedAt: string;
  degraded?: boolean;
  message?: string | null;
};

type PublicOffersResult = {
  rows: Array<{
    offer: RawOffer;
    product: CanonicalProduct;
  }>;
  total: number;
  limited?: boolean;
  generatedAt: string;
  degraded?: boolean;
  message?: string | null;
};

export type PublicMerchantsResult = {
  rows: PublicMerchantSummary[];
  total: number;
  limited?: boolean;
  limit?: number;
  offset?: number;
  generatedAt: string;
  degraded?: boolean;
  message?: string | null;
};

type OfferListFilters = {
  platform?: string | null;
  productType?: string | null;
  stock?: string | null;
  query?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string | null;
  limit?: number;
  offset?: number;
};

type MerchantListFilters = OfferListFilters & {
  collector?: string | null;
  signal?: string | null;
};

type ProductOfferListFilters = {
  limit?: number;
  offset?: number;
  filterTags?: string[] | null;
  query?: string | string[] | null;
  excludeQuery?: string | string[] | null;
  collector?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
};

let explorerCache: ExplorerData | null = null;
let merchantCache: PublicMerchantsResult | null = null;

export function clearPublicDataCache(): void {
  explorerCache = null;
  merchantCache = null;
}

export function clearPublicOfferDataCacheForProducts(_productIds: string[]): void {
  clearPublicDataCache();
}

export async function getExplorerData(): Promise<ExplorerData> {
  if (explorerCache) return explorerCache;

  const offers = publicOffers();
  const products = buildProductGroups(offers, publicCatalogProducts(canonicalCatalog)).map(toExplorerProductSummary);
  explorerCache = {
    generatedAt: generatedAt(),
    configured: false,
    degraded: false,
    message: null,
    products,
    sources: seedSources,
    offerTotal: offers.length,
  };
  return explorerCache;
}

export async function getPublicProductSummary(id: string): Promise<ExplorerProductSummary | null> {
  const normalized = normalizeId(id);
  const explorer = await getExplorerData();
  return explorer.products.find((product) => product.id === normalized || product.slug === normalized) || null;
}

export async function getPublicProductGroup(id: string) {
  return getPublicProductSummary(id);
}

export async function listPublicProductOffers(
  id: string,
  filters: ProductOfferListFilters = {},
): Promise<PublicProductOffersResult> {
  const product = await getPublicProductSummary(id);
  if (!product) {
    return {
      offers: [],
      total: 0,
      filterFacets: [],
      activeFilterTags: [],
      limited: false,
      generatedAt: generatedAt(),
      degraded: false,
      message: null,
    };
  }

  const limit = normalizePublicOfferLimit(filters.limit);
  const offset = normalizePublicOfferOffset(filters.offset);
  const includeQuery = normalizeQueryInput(filters.query);
  const excludeQuery = normalizeQueryInput(filters.excludeQuery);
  const activeFilterTags = parseOfferFilterTagsForProduct(product.id, filters.filterTags || []);
  const productOffers = publicOffers()
    .filter((offer) => resolveOfferProduct(offer, publicCatalogProducts(canonicalCatalog)).id === product.id);
  const filterFacets = filterOfferFilterFacetsForProduct(product.id, buildOfferFilterFacets(productOffers));
  const matched = productOffers
    .filter((offer) => offerMatchesFilterTags(offer, activeFilterTags))
    .filter((offer) => matchesQuery(offerText(offer), includeQuery))
    .filter((offer) => !excludeQuery || !matchesQuery(offerText(offer), excludeQuery))
    .filter((offer) => matchesCollector(offer, filters.collector))
    .filter((offer) => matchesPriceRange(offer, filters.minPrice, filters.maxPrice))
    .sort(compareOffers);

  return {
    offers: matched.slice(offset, offset + limit),
    total: matched.length,
    filterFacets,
    activeFilterTags,
    limited: matched.length > offset + limit,
    generatedAt: generatedAt(),
    degraded: false,
    message: null,
  };
}

export async function listPublicOffers(filters: OfferListFilters = {}): Promise<PublicOffersResult> {
  const limit = normalizePublicOfferLimit(filters.limit);
  const offset = normalizePublicOfferOffset(filters.offset);
  const products = publicCatalogProducts(canonicalCatalog);
  const rows = publicOffers()
    .map((offer) => ({
      offer,
      product: compactProduct(resolveOfferProduct(offer, products)),
    }))
    .filter(({ product }) => matchesText(product.platform, filters.platform))
    .filter(({ product }) => matchesText(product.productType, filters.productType))
    .filter(({ offer }) => matchesStock(offer, filters.stock))
    .filter(({ offer, product }) => matchesQuery(`${offerText(offer)} ${productText(product)}`, normalizePublicOfferQuery(filters.query)))
    .filter(({ offer }) => matchesPriceRange(offer, filters.minPrice, filters.maxPrice))
    .sort((left, right) => compareOfferRows(left, right, filters.sort));

  return {
    rows: rows.slice(offset, offset + limit),
    total: rows.length,
    limited: rows.length > offset + limit,
    generatedAt: generatedAt(),
    degraded: false,
    message: null,
  };
}

export async function listPublicMerchants(filters: MerchantListFilters = {}): Promise<PublicMerchantsResult> {
  const limit = normalizePublicOfferLimit(filters.limit);
  const offset = normalizePublicOfferOffset(filters.offset);
  const catalog = merchantCache || buildPublicMerchants();
  merchantCache = catalog;

  const rows = catalog.rows
    .filter((merchant) => matchesQuery(merchantText(merchant), normalizePublicOfferQuery(filters.query)))
    .filter((merchant) => matchesMerchantPlatform(merchant, filters.platform))
    .filter((merchant) => matchesMerchantProductType(merchant, filters.productType))
    .filter((merchant) => matchesMerchantStock(merchant, filters.stock))
    .filter((merchant) => matchesMerchantCollector(merchant, filters.collector))
    .filter((merchant) => matchesMerchantSignal(merchant, filters.signal))
    .sort((left, right) => compareMerchants(left, right, filters.sort));

  return {
    rows: rows.slice(offset, offset + limit),
    total: rows.length,
    limited: rows.length > offset + limit,
    limit,
    offset,
    generatedAt: generatedAt(),
    degraded: false,
    message: null,
  };
}

function publicOffers(): RawOffer[] {
  const products = publicCatalogProducts(canonicalCatalog);
  return seedRawOffers
    .filter((offer) => !offer.hidden)
    .filter((offer) => products.some((product) => product.id === resolveOfferProduct(offer, products).id))
    .map((offer) => ({
      ...offer,
      filterTags: offer.filterTags?.length ? offer.filterTags : deriveOfferFilterTags(offer),
      riskFeedback: offer.riskFeedback || null,
    }));
}

function toExplorerProductSummary(group: ReturnType<typeof buildProductGroups>[number]): ExplorerProductSummary {
  const { offers: _offers, lowestOffer, warrantyLowestOffer, ...product } = group;
  return {
    ...product,
    lowestOffer: compactPublicOffer(lowestOffer),
    warrantyLowestOffer: compactPublicOffer(warrantyLowestOffer),
    offerSearchText: productText(product),
  };
}

function compactPublicOffer(offer: RawOffer | null): PublicOfferSummary | null {
  if (!offer) return null;
  return {
    id: offer.id,
    sourceId: offer.sourceId,
    sourceName: offer.sourceName,
    sourceStoreName: offer.sourceStoreName,
    collectorKind: offer.collectorKind,
    sourceTitle: offer.sourceTitle,
    price: offer.price,
    currency: offer.currency,
    status: offer.status,
    url: offer.url,
    minOrderQuantity: offer.minOrderQuantity,
    bulkPricingTiers: offer.bulkPricingTiers,
  };
}

function compactProduct(product: CanonicalProduct): CanonicalProduct {
  return {
    id: product.id,
    slug: product.slug,
    displayName: product.displayName,
    platform: product.platform,
    productType: product.productType,
    spec: product.spec,
    summary: product.summary,
    aliases: product.aliases,
    updatedAt: product.updatedAt,
  };
}

function buildPublicMerchants(): PublicMerchantsResult {
  const products = publicCatalogProducts(canonicalCatalog);
  const sourceById = new Map(seedSources.map((source) => [source.id, source]));
  const groups = new Map<string, { summary: PublicMerchantSummary; productIds: Set<string>; platforms: Set<string>; productTypes: Set<string> }>();

  for (const offer of publicOffers()) {
    const product = resolveOfferProduct(offer, products);
    const source = offer.sourceId ? sourceById.get(offer.sourceId) || null : null;
    const key = offer.sourceId || offer.sourceName || hostFromUrl(offer.url) || offer.id;
    const collectorGroup = merchantCollectorGroup(offer.collectorKind || source?.collectorKind);
    const platform = merchantSourcePlatform({
      collectorKind: offer.collectorKind || source?.collectorKind,
      collectorGroup,
      sourceId: offer.sourceId,
      sourceName: offer.sourceName,
      sourceStoreName: offer.sourceStoreName,
      url: offer.url,
      entryUrl: source?.entryUrl,
      host: hostFromUrl(source?.entryUrl || offer.url),
    });
    const existing = groups.get(key);
    const summary = existing?.summary || {
      id: stableId("merchant", key),
      sourceId: offer.sourceId || null,
      name: offer.sourceStoreName || offer.sourceName,
      storeName: offer.sourceStoreName || null,
      sourceName: offer.sourceName,
      entryUrl: source?.entryUrl || offer.url,
      shopUrl: source?.entryUrl || offer.url,
      host: hostFromUrl(source?.entryUrl || offer.url),
      collectorKind: offer.collectorKind || source?.collectorKind || null,
      collectorGroup,
      collectorLabel: merchantCollectorLabel(collectorGroup),
      healthStatus: source?.healthStatus || null,
      lastSuccessAt: source?.lastSuccessAt || null,
      consecutiveFailures: source?.consecutiveFailures ?? null,
      productCount: 0,
      offerCount: 0,
      inStockCount: 0,
      outOfStockCount: 0,
      platformCount: 0,
      platforms: [],
      productTypes: [],
      lowestHitCount: 0,
      warrantyLowestHitCount: 0,
      riskFeedbackCount: 0,
      latestSeenAt: null,
      observationStartedAt: offerTimestamp(offer),
      includedAt: source?.createdAt || null,
      shopCreatedAt: source?.shopCreatedAt || null,
      representativeProduct: product.displayName,
      representativeOfferTitle: offer.sourceTitle,
      representativePrice: offer.price,
      representativeCurrency: offer.currency,
      hasPlatformAftersalesMechanism: platform.hasPlatformAftersalesMechanism,
    };
    const bucket = existing || { summary, productIds: new Set<string>(), platforms: new Set<string>(), productTypes: new Set<string>() };
    bucket.summary.offerCount += 1;
    bucket.summary.inStockCount += isAvailable(offer) ? 1 : 0;
    bucket.summary.outOfStockCount += isAvailable(offer) ? 0 : 1;
    bucket.summary.latestSeenAt = latestIso([bucket.summary.latestSeenAt, offerTimestamp(offer)]);
    bucket.productIds.add(product.id);
    bucket.platforms.add(product.platform);
    bucket.productTypes.add(product.productType);
    bucket.summary.productCount = bucket.productIds.size;
    bucket.summary.platformCount = bucket.platforms.size;
    bucket.summary.platforms = Array.from(bucket.platforms);
    bucket.summary.productTypes = Array.from(bucket.productTypes);
    groups.set(key, bucket);
  }

  const rows = Array.from(groups.values()).map(({ summary }) => summary).sort(compareMerchants);
  return {
    rows,
    total: rows.length,
    generatedAt: generatedAt(),
    degraded: false,
    message: null,
  };
}

function matchesCollector(offer: RawOffer, collector: string | null | undefined): boolean {
  const filter = normalizeCollectorFilter(collector);
  if (filter === "all") return true;
  const source = offer.sourceId ? seedSources.find((item) => item.id === offer.sourceId) || null : null;
  return merchantCollectorFilterMatchesSource(filter, {
    collectorKind: offer.collectorKind || source?.collectorKind,
    sourceId: offer.sourceId,
    sourceName: offer.sourceName,
    sourceStoreName: offer.sourceStoreName,
    url: offer.url,
    entryUrl: source?.entryUrl,
    host: hostFromUrl(source?.entryUrl || offer.url),
  });
}

function matchesMerchantCollector(merchant: PublicMerchantSummary, collector: string | null | undefined): boolean {
  const filter = normalizeCollectorFilter(collector);
  if (filter === "all") return true;
  return merchantCollectorFilterMatchesSource(filter, {
    collectorKind: merchant.collectorKind,
    collectorGroup: merchant.collectorGroup,
    sourceId: merchant.sourceId,
    sourceName: merchant.sourceName,
    sourceStoreName: merchant.storeName,
    entryUrl: merchant.entryUrl,
    host: merchant.host,
  });
}

function normalizeCollectorFilter(value: string | null | undefined): MerchantCollectorFilter {
  const text = String(value || "").trim();
  return (text || "all") as MerchantCollectorFilter;
}

function matchesStock(offer: RawOffer, stock: string | null | undefined): boolean {
  if (!stock || stock === "all") return true;
  if (stock === "in_stock") return isAvailable(offer);
  if (stock === "out_of_stock") return !isAvailable(offer);
  return offer.status === stock;
}

function matchesMerchantStock(merchant: PublicMerchantSummary, stock: string | null | undefined): boolean {
  if (!stock || stock === "all") return true;
  if (stock === "in_stock") return merchant.inStockCount > 0;
  if (stock === "out_of_stock") return merchant.inStockCount === 0;
  return true;
}

function matchesMerchantSignal(merchant: PublicMerchantSummary, signal: string | null | undefined): boolean {
  if (!signal || signal === "all") return true;
  if (signal === "lowest") return merchant.lowestHitCount > 0;
  if (signal === "warranty") return merchant.warrantyLowestHitCount > 0;
  if (signal === "platform_aftersales") return merchant.hasPlatformAftersalesMechanism;
  if (signal === "risk_clear") return merchant.riskFeedbackCount === 0;
  return true;
}

function matchesMerchantPlatform(merchant: PublicMerchantSummary, platform: string | null | undefined): boolean {
  return !platform || platform === "全部" || merchant.platforms.includes(platform);
}

function matchesMerchantProductType(merchant: PublicMerchantSummary, productType: string | null | undefined): boolean {
  return !productType || productType === "全部" || merchant.productTypes.includes(productType);
}

function matchesText(value: string, filter: string | null | undefined): boolean {
  return !filter || filter === "全部" || value === filter;
}

function matchesPriceRange(offer: RawOffer, minPrice: number | null | undefined, maxPrice: number | null | undefined): boolean {
  const price = offer.price;
  if (price === null || price === undefined) return minPrice === null && maxPrice === null;
  if (typeof minPrice === "number" && price < minPrice) return false;
  if (typeof maxPrice === "number" && price > maxPrice) return false;
  return true;
}

function matchesQuery(text: string, query: string): boolean {
  if (!query) return true;
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => text.toLowerCase().includes(part));
}

function compareOfferRows(
  left: { offer: RawOffer; product: CanonicalProduct },
  right: { offer: RawOffer; product: CanonicalProduct },
  sort?: string | null,
): number {
  if (sort === "price_desc") return (right.offer.price ?? -1) - (left.offer.price ?? -1);
  if (sort === "price_asc") return (left.offer.price ?? Number.MAX_SAFE_INTEGER) - (right.offer.price ?? Number.MAX_SAFE_INTEGER);
  if (sort === "latest") return (offerTimestamp(right.offer) || "").localeCompare(offerTimestamp(left.offer) || "");
  return compareOffers(left.offer, right.offer);
}

function compareMerchants(left: PublicMerchantSummary, right: PublicMerchantSummary, sort?: string | null): number {
  if (sort === "offers") return right.offerCount - left.offerCount;
  if (sort === "latest") return (right.latestSeenAt || "").localeCompare(left.latestSeenAt || "");
  return right.inStockCount - left.inStockCount || right.offerCount - left.offerCount || left.name.localeCompare(right.name);
}

function normalizeQueryInput(value: string | string[] | null | undefined): string {
  return normalizePublicOfferQuery(Array.isArray(value) ? value.join(" ") : value);
}

function normalizeId(value: string): string {
  return value.trim();
}

function offerText(offer: RawOffer): string {
  return [
    offer.sourceTitle,
    offer.sourceName,
    offer.sourceStoreName,
    offer.tags?.join(" "),
    offer.filterTags?.join(" "),
  ].filter(Boolean).join(" ");
}

function productText(product: Pick<CanonicalProduct, "displayName" | "platform" | "productType" | "spec" | "summary" | "aliases">): string {
  return [
    product.displayName,
    product.platform,
    product.productType,
    product.spec,
    product.summary,
    product.aliases.join(" "),
  ].filter(Boolean).join(" ");
}

function merchantText(merchant: PublicMerchantSummary): string {
  return [
    merchant.name,
    merchant.storeName,
    merchant.sourceName,
    merchant.host,
    merchant.representativeProduct,
    merchant.representativeOfferTitle,
    merchant.platforms.join(" "),
    merchant.productTypes.join(" "),
  ].filter(Boolean).join(" ");
}

function offerTimestamp(offer: RawOffer): string | null {
  return offer.verifiedAt || offer.lastSeenAt || offer.capturedAt || offer.sourceUpdatedAt || null;
}

function latestIso(values: Array<string | null | undefined>): string | null {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) || null;
}

function hostFromUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function generatedAt(): string {
  return new Date().toISOString();
}
