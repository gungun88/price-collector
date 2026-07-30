import { z } from "zod";
import {
  checkPublicWriteRateLimit,
  getPublicClientFingerprint,
  getPublicRequestErrorStatus,
  readJsonWithLimit,
} from "@/lib/public-request";

const accessModeSchema = z.enum(["public_only", "test_key", "test_account"]);
const PUBLIC_TRANSIT_SUBMISSION_RATE_LIMIT_PER_HOUR = 20;
const httpUrlSchema = z.string().url().max(2048).refine((value) => isHttpUrl(value), {
  message: "链接仅支持 http 或 https。",
});

const credentialSchema = z.object({
  accessMode: accessModeSchema,
  safetyConfirmed: z.boolean().optional(),
  apiKey: z.string().trim().max(3000).optional().nullable(),
  loginUrl: httpUrlSchema.optional().nullable(),
  username: z.string().trim().max(300).optional().nullable(),
  password: z.string().trim().max(3000).optional().nullable(),
  budgetLimit: z.string().trim().max(200).optional().nullable(),
  expiresAt: z.string().trim().max(80).optional().nullable(),
  allowedModels: z.array(z.string().trim().max(80)).max(30).optional(),
  allowedGroups: z.array(z.string().trim().max(120)).max(30).optional(),
  groupName: z.string().trim().max(120).optional().nullable(),
  groupId: z.string().trim().max(120).optional().nullable(),
  accountPool: z.string().trim().max(120).optional().nullable(),
  family: z.string().trim().max(40).optional().nullable(),
  standardModel: z.string().trim().max(120).optional().nullable(),
  rawModelName: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).optional();

const schema = z.object({
  type: z.enum(["user", "merchant"]).default("user"),
  stationId: z.string().trim().max(120).optional().nullable(),
  url: httpUrlSchema,
  name: z.string().trim().max(200).optional().nullable(),
  apiBaseUrl: httpUrlSchema.optional().nullable(),
  pricingUrl: httpUrlSchema.optional().nullable(),
  contact: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  models: z.array(z.string().trim().max(80)).max(30).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  accessMode: accessModeSchema.optional(),
  credentials: credentialSchema,
  website: z.string().max(200).optional().nullable(),
});

const SELF_HOSTED_TRANSIT_SUBMISSION_PATH = "/api/transit/submissions";

export async function POST(request: Request) {
  try {
    const submitterIp = getPublicClientFingerprint(request);
    checkPublicWriteRateLimit({
      scope: "api-transit-submissions",
      key: submitterIp,
      limit: PUBLIC_TRANSIT_SUBMISSION_RATE_LIMIT_PER_HOUR,
    });

    const payload = schema.parse(await readJsonWithLimit(request));
    if (payload.website) return Response.json({ ok: true });

    validateSubmissionAccess(payload);
    if (getSubmissionAccessMode(payload) !== "public_only") {
      throw new Error("当前自托管版本只接收公开渠道链接，暂不接收测试 Key 或测试账号。");
    }

    const selfHostedApiBaseUrl = getSelfHostedApiBaseUrl();
    if (!selfHostedApiBaseUrl) {
      throw new Error("SELF_HOSTED_API_BASE_URL is not configured.");
    }
    return forwardTransitSubmissionToSelfHostedApi({
      request,
      payload,
      submitterIp,
      selfHostedApiBaseUrl,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = getErrorStatus(error, message);
    if (status >= 500) console.error("[api-transit-submissions] failed", error);
    return Response.json({ ok: false, message }, { status });
  }
}

async function forwardTransitSubmissionToSelfHostedApi({
  request,
  payload,
  submitterIp,
  selfHostedApiBaseUrl,
}: {
  request: Request;
  payload: z.infer<typeof schema>;
  submitterIp: string;
  selfHostedApiBaseUrl: string;
}) {
  const url = new URL(SELF_HOSTED_TRANSIT_SUBMISSION_PATH, selfHostedApiBaseUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: buildSelfHostedForwardHeaders(request, submitterIp),
    body: JSON.stringify({
      type: payload.type,
      url: payload.url,
      name: payload.name ?? null,
      apiBaseUrl: payload.apiBaseUrl ?? null,
      pricingUrl: payload.pricingUrl ?? null,
      contact: payload.contact ?? null,
      notes: payload.notes ?? null,
      models: payload.models || [],
      meta: buildSafeMeta(payload),
      website: payload.website ?? null,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  const json = await response.json().catch(() => null);
  return Response.json(json || { ok: response.ok }, { status: response.status });
}

function buildSelfHostedForwardHeaders(request: Request, submitterIp: string): Headers {
  const headers = new Headers({
    "content-type": "application/json",
    "x-priceai-client-fingerprint": submitterIp,
  });
  const forwardSecret = process.env.PRICEAI_FORWARD_SECRET?.trim();
  if (forwardSecret) headers.set("x-priceai-forward-secret", forwardSecret);

  for (const name of ["user-agent", "cf-connecting-ip", "x-forwarded-for", "x-real-ip"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function getSelfHostedApiBaseUrl(): string | null {
  const configured = process.env.SELF_HOSTED_API_BASE_URL || process.env.PRICEAI_API_BASE_URL || "";
  const fallback = process.env.NODE_ENV === "development" ? "http://localhost:4100" : "";
  const value = (configured || fallback).trim();
  return value ? value.replace(/\/+$/, "") : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) return "提交内容格式不正确，请检查链接和字段。";
  if (error instanceof Error) return error.message;
  return "提交失败，请稍后再试。";
}

function getErrorStatus(error: unknown, message: string): number {
  const publicRequestStatus = getPublicRequestErrorStatus(error);
  if (publicRequestStatus) return publicRequestStatus;
  if (error instanceof z.ZodError) return 400;
  if (message.includes("尚未配置")) return 503;
  if (message.includes("过于频繁")) return 429;
  if (isClientSubmissionError(message)) return 400;
  return 500;
}

function isClientSubmissionError(message: string): boolean {
  return [
    "链接仅支持",
    "至少需要",
    "需要填写",
    "请确认",
    "只有商家入驻",
    "Invalid URL",
  ].some((keyword) => message.includes(keyword));
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateSubmissionAccess(payload: z.infer<typeof schema>) {
  if (payload.type !== "merchant") return;

  const accessMode = getSubmissionAccessMode(payload);
  const monitorUrl = typeof payload.meta?.monitorUrl === "string" ? payload.meta.monitorUrl : "";
  if (accessMode === "public_only" && !payload.pricingUrl && !monitorUrl) {
    throw new Error("公开资料接入至少需要填写公开价格页或公开监测页。");
  }

  if (accessMode === "test_key") {
    if (!payload.credentials?.apiKey?.trim()) throw new Error("测试 Key 接入需要填写低额度测试 API Key。");
    if (!payload.credentials.safetyConfirmed) throw new Error("请确认提供的是低额度测试 Key，不是主账号或长期高额度 Key。");
  }

  if (accessMode === "test_account") {
    if (!payload.credentials?.loginUrl || !payload.credentials.username || !payload.credentials.password) {
      throw new Error("测试账号接入需要填写登录地址、测试账号和密码。");
    }
    if (!payload.credentials.safetyConfirmed) throw new Error("请确认提供的是专用测试账号，不是主账号。");
  }
}

function buildSafeMeta(payload: z.infer<typeof schema>): Record<string, unknown> {
  const meta = { ...(payload.meta || {}) };
  const accessMode = getSubmissionAccessMode(payload);
  if (payload.stationId) meta.stationId = payload.stationId;
  meta.accessMode = accessMode;

  if (payload.credentials && payload.credentials.accessMode !== "public_only") {
    meta.credentialStatus = "submitted";
    meta.credentialType = payload.credentials.accessMode;
    meta.credentialBudgetLimit = payload.credentials.budgetLimit || null;
    meta.credentialExpiresAt = payload.credentials.expiresAt || null;
    meta.credentialAllowedModels = payload.credentials.allowedModels || payload.models || [];
    meta.credentialAllowedGroups = payload.credentials.allowedGroups || [];
    meta.credentialGroupName = payload.credentials.groupName || null;
    meta.credentialGroupId = payload.credentials.groupId || null;
    meta.credentialAccountPool = payload.credentials.accountPool || null;
    meta.credentialFamily = payload.credentials.family || null;
    meta.credentialStandardModel = payload.credentials.standardModel || null;
    meta.credentialRawModelName = payload.credentials.rawModelName || null;
    meta.credentialSafetyConfirmed = Boolean(payload.credentials.safetyConfirmed);
  }

  return meta;
}

function getSubmissionAccessMode(payload: z.infer<typeof schema>) {
  if (payload.type !== "merchant") return "public_only";
  return payload.accessMode || payload.credentials?.accessMode || "public_only";
}
