import "server-only";

import {
  apiProviderCandidates,
  getPublicApiModelDataset,
  staticApiModelDataset,
  type ApiModelDataset,
} from "@/lib/api-models";
import type {
  ApiModelAdminData,
  ApiModelAdminModel,
  ApiModelAdminOffer,
  ApiModelAdminPlan,
  ApiModelAdminProvider,
  ApiProviderCandidate as ApiProviderAdminCandidate,
  ApiProviderSubmission,
  ApiProviderSubmissionStatus,
} from "@/lib/types";

const API_MODEL_CACHE_TTL_MS = 30_000;

let apiModelCache: { expiresAt: number; value: ApiModelDataset } | null = null;
let apiModelPromise: Promise<ApiModelDataset> | null = null;

export function clearApiModelDatasetCache() {
  apiModelCache = null;
  apiModelPromise = null;
}

export async function getApiModelDataset(): Promise<ApiModelDataset> {
  const now = Date.now();
  if (apiModelCache && apiModelCache.expiresAt > now) return apiModelCache.value;
  if (apiModelPromise) return apiModelPromise;

  apiModelPromise = Promise.resolve(getPublicApiModelDataset({
    ...staticApiModelDataset,
    source: "static",
  })).then((value) => {
    apiModelCache = {
      expiresAt: Date.now() + API_MODEL_CACHE_TTL_MS,
      value,
    };
    return value;
  }).finally(() => {
    apiModelPromise = null;
  });

  return apiModelPromise;
}

export async function getApiModelAdminData(): Promise<ApiModelAdminData> {
  return buildStaticApiModelAdminData({
    configured: true,
    tableReady: false,
    message: "当前自托管版本暂未接入官方 API 模型后台维护，页面展示静态官方 API 样本。",
  });
}

export async function createApiProviderSubmission(input: {
  url: string;
  name?: string | null;
  contact?: string | null;
  notes?: string | null;
  honeypot?: string | null;
  submitterIp?: string | null;
  rateLimitPerHour?: number;
}): Promise<{ id: string; reviewStatus: ApiProviderSubmissionStatus } | { ignored: true }> {
  if (input.honeypot) return { ignored: true };
  throw new Error("当前自托管版本暂未开放官方 API 渠道提交。");
}

export async function listApiProviderSubmissions(
  _status: ApiProviderSubmissionStatus = "pending",
): Promise<ApiProviderSubmission[]> {
  return [];
}

export async function updateApiProviderSubmissionReview(_input: {
  id: string;
  reviewStatus: ApiProviderSubmissionStatus;
  adminNote?: string | null;
}): Promise<ApiProviderSubmission> {
  throw new Error("当前自托管版本暂未开放官方 API 渠道提交审核。");
}

function buildStaticApiModelAdminData({
  configured,
  tableReady,
  message,
}: {
  configured: boolean;
  tableReady: boolean;
  message: string | null;
}): ApiModelAdminData {
  const models = staticApiModelDataset.models.map((model): ApiModelAdminModel => {
    const offers = staticApiModelDataset.offers.filter((offer) => offer.modelId === model.id);
    return {
      id: model.id,
      family: model.family,
      displayName: model.displayName,
      modelId: model.modelId,
      contextWindow: model.contextWindow || null,
      description: model.description,
      status: "active",
      offerCount: offers.length,
      providerCount: new Set(offers.map((offer) => offer.providerId)).size,
      sourceUrl: model.sourceUrl,
      sourceLabel: model.sourceLabel,
      capabilities: model.capabilities,
      suitableTools: model.suitableTools,
      updatedAt: model.updatedAt,
    };
  });

  const providers = staticApiModelDataset.providers.map((provider): ApiModelAdminProvider => {
    const offers = staticApiModelDataset.offers.filter((offer) => offer.providerId === provider.id);
    const plans = staticApiModelDataset.plans.filter((plan) => plan.providerId === provider.id);
    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      billingMode: provider.billingMode,
      url: provider.url,
      pricingUrl: provider.pricingUrl || null,
      logoUrl: provider.logoUrl || null,
      enabled: true,
      offerCount: offers.length,
      modelCount: new Set(offers.map((offer) => offer.modelId)).size,
      planCount: plans.length,
      description: provider.description,
      limitSummary: provider.limitSummary,
      limitations: provider.limitations,
      sourceLabel: provider.sourceLabel,
      updatedAt: provider.updatedAt,
    };
  });

  const providerNameById = new Map(staticApiModelDataset.providers.map((provider) => [provider.id, provider.name]));
  const plans = staticApiModelDataset.plans.map((plan): ApiModelAdminPlan => ({
    id: plan.id,
    providerId: plan.providerId,
    providerName: providerNameById.get(plan.providerId) || plan.providerName,
    name: plan.name,
    type: plan.type,
    priceLabel: plan.priceLabel,
    priceUsdMonthly: plan.priceUsdMonthly ?? null,
    priceCnyMonthly: plan.priceCnyMonthly ?? null,
    modelIds: plan.modelIds,
    modelCount: plan.modelIds.length,
    enabled: true,
    quotaSummary: plan.quotaSummary,
    resetSummary: plan.resetSummary,
    limitSummary: plan.limitSummary,
    limitations: plan.limitations,
    coverageLabel: plan.coverageLabel || null,
    compatibility: plan.compatibility,
    suitableTools: plan.suitableTools,
    sourceUrl: plan.url,
    sourceLabel: plan.sourceLabel,
    updatedAt: plan.updatedAt,
  }));

  const modelById = new Map(staticApiModelDataset.models.map((model) => [model.id, model]));
  const providerById = new Map(staticApiModelDataset.providers.map((provider) => [provider.id, provider]));
  const offers = staticApiModelDataset.offers
    .map((offer): ApiModelAdminOffer | null => {
      const model = modelById.get(offer.modelId);
      const provider = providerById.get(offer.providerId);
      if (!model || !provider) return null;
      return {
        id: offer.id,
        modelId: offer.modelId,
        modelName: model.displayName,
        family: model.family,
        providerId: offer.providerId,
        providerName: provider.name,
        providerType: provider.type,
        routeModelId: offer.routeModelId || null,
        inputPrice: offer.inputPrice,
        outputPrice: offer.outputPrice,
        cacheReadPrice: offer.cacheReadPrice || null,
        cacheWritePrice: offer.cacheWritePrice || null,
        freeOrPlan: offer.freeOrPlan,
        limitSummary: offer.limitSummary,
        limitations: offer.limitations,
        compatibility: offer.compatibility,
        suitableTools: offer.suitableTools,
        pricingUrl: offer.pricingUrl || null,
        sourceLabel: offer.sourceLabel,
        status: "active",
        notes: offer.notes || null,
        updatedAt: offer.updatedAt,
      };
    })
    .filter((offer): offer is ApiModelAdminOffer => Boolean(offer));

  return {
    configured,
    tableReady,
    source: "static",
    generatedAt: staticApiModelDataset.generatedAt,
    message,
    models,
    providers,
    plans,
    offers,
    collectRuns: [],
    providerCandidates: buildApiProviderCandidates(),
    providerSubmissions: [],
  };
}

function buildApiProviderCandidates(): ApiProviderAdminCandidate[] {
  return apiProviderCandidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    type: candidate.type,
    billingMode: candidate.billingMode,
    url: candidate.url,
    pricingUrl: candidate.pricingUrl,
    logoUrl: candidate.logoUrl,
    status: candidate.status,
    priority: candidate.priority,
    evidenceStatus: candidate.evidenceStatus,
    sourceLabel: candidate.sourceLabel,
    reason: candidate.reason,
    nextStep: candidate.nextStep,
    notes: candidate.notes,
    updatedAt: candidate.updatedAt,
  }));
}
