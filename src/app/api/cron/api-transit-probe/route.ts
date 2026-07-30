export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: false, message: "旧 API 中转探测定时任务已停用。" }, { status: 405 });
}

export async function POST() {
  return Response.json(
    {
      ok: false,
      message: "旧 API 中转探测定时任务已停用。后续探测应接入自托管 PostgreSQL 后端。",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
