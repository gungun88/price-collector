import { NextResponse } from "next/server";
import { withCloudflarePublicCache } from "@/lib/cloudflare-edge-cache";
import { getSelfHostedApiBaseUrl } from "@/lib/selfhost-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEALTH_EDGE_TTL_SECONDS = 15;
const HEALTH_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Cloudflare-CDN-Cache-Control": `public, s-maxage=${HEALTH_EDGE_TTL_SECONDS}, stale-while-revalidate=30`,
};

export async function GET(request: Request) {
  return withCloudflarePublicCache(request, {
    namespace: "health-v2-selfhost",
    ttlSeconds: HEALTH_EDGE_TTL_SECONDS,
    cacheKeySearchParams: new URLSearchParams(),
    load: loadHealthResponse,
  });
}

async function loadHealthResponse() {
  const generatedAt = new Date().toISOString();
  let backendUrl = "";

  try {
    backendUrl = getSelfHostedApiBaseUrl();
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "not_configured",
        generatedAt,
        backendReachable: false,
        message: error instanceof Error ? error.message : "自托管后端尚未配置。",
      },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  try {
    const response = await fetch(new URL("/health", backendUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    const body = await response.json().catch(() => null);
    return NextResponse.json(
      {
        ok: response.ok,
        status: response.ok ? "ok" : "degraded",
        generatedAt,
        backendReachable: response.ok,
        backendUrl,
        backend: body,
        message: response.ok ? null : "自托管后端健康检查失败。",
      },
      { status: response.ok ? 200 : 503, headers: response.ok ? HEALTH_CACHE_HEADERS : { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        generatedAt,
        backendReachable: false,
        backendUrl,
        message: error instanceof Error ? error.message : "自托管后端不可达。",
      },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
