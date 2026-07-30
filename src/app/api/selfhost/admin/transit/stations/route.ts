import { z } from "zod";
import {
  readSelfhostJsonResponse,
  selfHostedApiUrl,
  selfhostCookieHeaderFromRequest,
} from "@/lib/selfhost-api";
import { clearSelfhostTransitAdminCaches } from "@/lib/selfhost-transit-admin-revalidation";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

const patchSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().nullable().optional(),
  apiBaseUrl: z.string().url().nullable().optional(),
  pricingUrl: z.string().url().nullable().optional(),
  monitorUrl: z.string().url().nullable().optional(),
  summary: z.string().nullable().optional(),
  status: z.enum(["unknown", "active", "risky", "inactive"]).optional(),
  published: z.boolean().optional(),
  sourceType: z.string().optional(),
  commercialRelation: z.enum(["unknown", "none", "partner", "sponsor"]).optional(),
  stationSystem: z.enum(["new_api", "sub_to_api", "custom", "unknown"]).optional(),
  operatorType: z.enum(["company", "individual", "unknown"]).optional(),
  invoiceSupport: z.enum(["supported", "unsupported", "unknown"]).optional(),
  channelTypes: z.array(z.string()).optional(),
  accountPools: z.array(z.string()).optional(),
  paymentMethods: z.array(z.string()).optional(),
  supportChannels: z.array(z.string()).optional(),
  riskLabels: z.array(z.string()).optional(),
  minimumTopUp: z.string().nullable().optional(),
  balanceExpiry: z.string().nullable().optional(),
  refundPolicy: z.string().nullable().optional(),
  strengths: z.array(z.string()).optional(),
  cautions: z.array(z.string()).optional(),
  usageAdvice: z.enum(["pending", "trial_only", "normal", "avoid"]).optional(),
  dataStatus: z.enum(["pending_review", "verified", "stale"]).optional(),
  adminNote: z.string().nullable().optional(),
});

const createSchema = patchSchema.omit({ id: true }).extend({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).optional(),
  websiteUrl: z.string().url(),
});

const deleteSchema = z.object({
  id: z.string().trim().min(1),
  removedReason: z.string().trim().nullable().optional(),
});

const restoreSchema = z.object({
  id: z.string().trim().min(1),
});

export async function GET(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(selfHostedApiUrl("/api/admin/transit/stations"));
    for (const key of ["bucket", "q", "limit", "offset"]) {
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
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted stations request failed." },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const payload = patchSchema.parse(await request.json());
    const response = await fetch(selfHostedApiUrl(`/api/admin/transit/stations/${encodeURIComponent(payload.id)}`), {
      method: "PATCH",
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
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted station update failed." },
      { status: error instanceof z.ZodError ? 400 : 502, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const payload = createSchema.parse(await request.json());
    const response = await fetch(selfHostedApiUrl("/api/admin/transit/stations"), {
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
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted station create failed." },
      { status: error instanceof z.ZodError ? 400 : 502, headers: NO_STORE_HEADERS },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const payload = deleteSchema.parse(await request.json());
    const response = await fetch(selfHostedApiUrl(`/api/admin/transit/stations/${encodeURIComponent(payload.id)}`), {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify({ removedReason: payload.removedReason ?? null }),
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    if (response.ok) await clearSelfhostTransitAdminCaches(request);
    return Response.json(json, { status: response.status, headers: NO_STORE_HEADERS });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted station remove failed." },
      { status: error instanceof z.ZodError ? 400 : 502, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const payload = restoreSchema.parse(await request.json());
    const response = await fetch(selfHostedApiUrl(`/api/admin/transit/stations/${encodeURIComponent(payload.id)}/restore`), {
      method: "POST",
      headers: cookie ? { cookie } : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    return Response.json(json, { status: response.status, headers: NO_STORE_HEADERS });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted station restore failed." },
      { status: error instanceof z.ZodError ? 400 : 502, headers: NO_STORE_HEADERS },
    );
  }
}
