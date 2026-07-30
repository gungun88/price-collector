import { noStoreCacheHeaders } from "@/lib/cache-headers";

export function GET() {
  return Response.json({ ok: true, user: null }, { headers: noStoreCacheHeaders() });
}
