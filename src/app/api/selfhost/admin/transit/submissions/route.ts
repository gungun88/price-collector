import { z } from "zod";
import {
  readSelfhostJsonResponse,
  selfHostedApiUrl,
  selfhostCookieHeaderFromRequest,
} from "@/lib/selfhost-api";
import { clearSelfhostTransitAdminCaches } from "@/lib/selfhost-transit-admin-revalidation";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

const patchSchema = z.object({
  id: z.string().min(1),
  reviewStatus: z.enum(["pending", "collector_todo", "approved", "rejected"]),
  stationId: z.string().trim().min(1).nullable().optional(),
  adminNote: z.string().trim().max(1000).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(selfHostedApiUrl("/api/admin/transit/submissions"));
    for (const key of ["status", "limit", "offset"]) {
      const value = requestUrl.searchParams.get(key);
      if (value) upstreamUrl.searchParams.set(key, value);
    }

    const response = await fetch(upstreamUrl, {
      headers: cookie ? { cookie } : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    return Response.json(json, { status: response.status, headers: NO_STORE_HEADERS });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted submissions request failed." },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const payload = patchSchema.parse(await request.json());
    const response = await fetch(selfHostedApiUrl(`/api/admin/transit/submissions/${encodeURIComponent(payload.id)}`), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify({
        reviewStatus: payload.reviewStatus,
        stationId: payload.stationId ?? null,
        adminNote: payload.adminNote ?? null,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    if (response.ok) await clearSelfhostTransitAdminCaches(request);
    return Response.json(json, { status: response.status, headers: NO_STORE_HEADERS });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted submission update failed." },
      { status: error instanceof z.ZodError ? 400 : 502, headers: NO_STORE_HEADERS },
    );
  }
}
