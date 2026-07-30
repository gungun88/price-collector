import "server-only";

import { getRuntimeEnv } from "@/lib/runtime-env";
import {
  DEFAULT_RISK_REVIEW_BASE_URL,
  DEFAULT_RISK_REVIEW_MODEL,
  RISK_PRECHECK_ENV,
} from "@/lib/trust-risk";
import type { RiskReviewSettingsSummary } from "@/lib/types";

export const DEFAULT_RISK_REVIEW_TIMEOUT_MS = 12_000;
export const DEFAULT_RISK_REVIEW_DAILY_LIMIT = 100;
export const DEFAULT_RISK_REVIEW_MAX_OUTPUT_TOKENS = 900;
export const DEFAULT_RISK_REVIEW_MAX_RESPONSE_BYTES = 256 * 1024;

export type RiskReviewRuntimeConfig = {
  provider: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  dailyLimit: number;
  maxOutputTokens: number;
  maxResponseBytes: number;
  apiKey: string | null;
  source: RiskReviewSettingsSummary["source"];
};

export type RiskReviewSettingsInput = {
  provider?: string | null;
  baseUrl?: string | null;
  model?: string | null;
  timeoutMs?: number | null;
  apiKey?: string | null;
};

export async function getRiskReviewRuntimeConfig(): Promise<RiskReviewRuntimeConfig> {
  const apiKey = getRuntimeEnv(RISK_PRECHECK_ENV.apiKey) || null;
  return {
    provider: "opencode",
    baseUrl: environmentBaseUrl(),
    model: environmentModel(),
    timeoutMs: normalizeTimeoutMs(Number(getRuntimeEnv(RISK_PRECHECK_ENV.timeoutMs))),
    dailyLimit: environmentDailyLimit(),
    maxOutputTokens: environmentMaxOutputTokens(),
    maxResponseBytes: environmentMaxResponseBytes(),
    apiKey,
    source: apiKey ? "environment" : "unconfigured",
  };
}

export async function getRiskReviewSettingsSummary(): Promise<RiskReviewSettingsSummary> {
  return getFallbackRiskReviewSettingsSummary("当前风险预审仅支持环境变量配置。");
}

export function getFallbackRiskReviewSettingsSummary(message = "当前风险预审仅支持环境变量配置。"): RiskReviewSettingsSummary {
  const hasEnvApiKey = Boolean(getRuntimeEnv(RISK_PRECHECK_ENV.apiKey));
  return {
    configured: hasEnvApiKey,
    tableReady: false,
    source: hasEnvApiKey ? "environment" : "unconfigured",
    provider: "opencode",
    baseUrl: environmentBaseUrl(),
    model: environmentModel(),
    timeoutMs: normalizeTimeoutMs(Number(getRuntimeEnv(RISK_PRECHECK_ENV.timeoutMs))),
    hasApiKey: hasEnvApiKey,
    apiKeyLast4: null,
    updatedAt: null,
    message,
  };
}

export async function updateRiskReviewSettings(_input: RiskReviewSettingsInput): Promise<RiskReviewSettingsSummary> {
  throw new Error("风险预审配置后台已迁移，当前自托管后台暂未开放该设置。");
}

function environmentBaseUrl(): string {
  return (getRuntimeEnv(RISK_PRECHECK_ENV.baseUrl) || DEFAULT_RISK_REVIEW_BASE_URL).replace(/\/+$/, "");
}

function environmentModel(): string {
  return getRuntimeEnv(RISK_PRECHECK_ENV.model) || DEFAULT_RISK_REVIEW_MODEL;
}

function environmentDailyLimit(): number {
  return boundedInteger(getRuntimeEnv("PRICEAI_RISK_REVIEW_DAILY_LIMIT"), DEFAULT_RISK_REVIEW_DAILY_LIMIT, 1, 100000);
}

function environmentMaxOutputTokens(): number {
  return boundedInteger(getRuntimeEnv("PRICEAI_RISK_REVIEW_MAX_OUTPUT_TOKENS"), DEFAULT_RISK_REVIEW_MAX_OUTPUT_TOKENS, 128, 8000);
}

function environmentMaxResponseBytes(): number {
  return boundedInteger(getRuntimeEnv("PRICEAI_RISK_REVIEW_MAX_RESPONSE_BYTES"), DEFAULT_RISK_REVIEW_MAX_RESPONSE_BYTES, 16 * 1024, 2 * 1024 * 1024);
}

function normalizeTimeoutMs(value: number | null | undefined): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 3_000 && numberValue <= 60_000
    ? Math.round(numberValue)
    : DEFAULT_RISK_REVIEW_TIMEOUT_MS;
}

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}
