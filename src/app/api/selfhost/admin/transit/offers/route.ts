import { z } from "zod";
import {
  TRANSIT_STANDARD_MODELS,
  transitStandardModelMatchesFamily,
} from "@/data/api-transit/types";
import {
  readSelfhostJsonResponse,
  selfHostedApiUrl,
  selfhostCookieHeaderFromRequest,
} from "@/lib/selfhost-api";
import { clearSelfhostTransitAdminCaches } from "@/lib/selfhost-transit-admin-revalidation";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

const offerBaseSchema = z.object({
  id: z.string().trim().min(1).optional(),
  stationId: z.string().trim().min(1),
  family: z.enum(["gpt", "claude", "gemini", "grok", "glm", "deepseek", "image", "video"]),
  standardModel: z.enum(TRANSIT_STANDARD_MODELS),
  rawModelName: z.string().trim().nullable().optional(),
  groupName: z.string().trim().min(1).default("default"),
  rechargeRatio: z.string().trim().nullable().optional(),
  modelMultiplier: z.number().finite().nullable().optional(),
  inputPrice: z.number().finite().nullable().optional(),
  outputPrice: z.number().finite().nullable().optional(),
  cacheReadPrice: z.number().finite().nullable().optional(),
  cacheWritePrice: z.number().finite().nullable().optional(),
  fixedPrice: z.number().finite().nullable().optional(),
  fixedPriceUnit: z.string().trim().nullable().optional(),
  currency: z.literal("CNY").default("CNY"),
  accountPool: z.string().trim().nullable().optional(),
  channelType: z.string().trim().nullable().optional(),
  priceSource: z.string().trim().nullable().optional(),
  status: z.enum(["active", "needs_review", "inactive"]).default("needs_review"),
  lastVerifiedAt: z.string().datetime().nullable().optional(),
});

const offerSchema = offerBaseSchema.refine(
  (value) => transitStandardModelMatchesFamily(value.standardModel, value.family),
  {
    message: "标准模型与模型系列不匹配。",
    path: ["standardModel"],
  },
);

const patchSchema = offerBaseSchema.partial().extend({
  id: z.string().trim().min(1),
}).refine(
  (value) => !value.standardModel || !value.family || transitStandardModelMatchesFamily(value.standardModel, value.family),
  {
    message: "标准模型与模型系列不匹配。",
    path: ["standardModel"],
  },
);

export async function GET(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(selfHostedApiUrl("/api/admin/transit/offers"));
    for (const key of ["stationId", "status", "limit", "offset"]) {
      const value = requestUrl.searchParams.get(key);
      if (value) upstreamUrl.searchParams.set(key, value);
    }

    const response = await fetch(upstreamUrl, {
      headers: cookie ? { cookie } : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    if (response.ok) await clearSelfhostTransitAdminCaches(request);
    return Response.json(json, { status: response.status, headers: NO_STORE_HEADERS });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted offers request failed." },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const payload = offerSchema.parse(await request.json());
    const response = await fetch(selfHostedApiUrl("/api/admin/transit/offers"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    if (response.ok) await clearSelfhostTransitAdminCaches(request);
    return Response.json(json, { status: response.status, headers: NO_STORE_HEADERS });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted offer create failed." },
      { status: error instanceof z.ZodError ? 400 : 502, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const payload = patchSchema.parse(await request.json());
    const response = await fetch(selfHostedApiUrl(`/api/admin/transit/offers/${encodeURIComponent(payload.id)}`), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    return Response.json(json, { status: response.status, headers: NO_STORE_HEADERS });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted offer update failed." },
      { status: error instanceof z.ZodError ? 400 : 502, headers: NO_STORE_HEADERS },
    );
  }
}
