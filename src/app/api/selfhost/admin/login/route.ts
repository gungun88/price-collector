import {
  mapSelfhostSetCookie,
  readSelfhostJsonResponse,
  selfHostedApiUrl,
} from "@/lib/selfhost-api";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const response = await fetch(selfHostedApiUrl("/api/admin/login"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const json = await readSelfhostJsonResponse(response);
    const headers = new Headers(NO_STORE_HEADERS);
    const cookie = mapSelfhostSetCookie(response.headers.get("set-cookie"));
    if (cookie) headers.set("Set-Cookie", cookie);
    return Response.json(json, { status: response.status, headers });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Self-hosted admin login failed." },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}
