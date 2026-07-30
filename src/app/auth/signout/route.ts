import { NextResponse } from "next/server";
import { noStoreCacheHeaders } from "@/lib/cache-headers";

export function POST() {
  return NextResponse.json({ ok: true, scope: "local" }, { headers: noStoreCacheHeaders() });
}
