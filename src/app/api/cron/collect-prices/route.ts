export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: false, message: "旧价格采集定时任务已停用。" }, { status: 405 });
}

export async function POST() {
  return Response.json(
    {
      ok: false,
      message: "旧价格采集定时任务已停用。当前请使用自托管后台维护数据。",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
