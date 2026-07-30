import { NextResponse } from "next/server";
import { noStoreCacheHeaders } from "@/lib/cache-headers";

export function GET() {
  return NextResponse.json(
    { ok: false, code: "auth_disabled", message: "当前自托管版本暂未开放用户登录。" },
    { status: 410, headers: noStoreCacheHeaders() },
  );
}
