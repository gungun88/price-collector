import {
  clearSelfhostAdminCookie,
  readSelfhostJsonResponse,
  selfHostedApiUrl,
  selfhostCookieHeaderFromRequest,
} from "@/lib/selfhost-api";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export async function POST(request: Request) {
  try {
    const cookie = selfhostCookieHeaderFromRequest(request);
    const response = await fetch(selfHostedApiUrl("/api/admin/logout"), {
      method: "POST",
      headers: cookie ? { cookie } : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    return Response.json(json, {
      status: response.status,
      headers: { ...NO_STORE_HEADERS, "Set-Cookie": clearSelfhostAdminCookie() },
    });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted admin logout failed." },
      { status: 502, headers: { ...NO_STORE_HEADERS, "Set-Cookie": clearSelfhostAdminCookie() } },
    );
  }
}
