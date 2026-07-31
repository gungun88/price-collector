export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const versionId = process.env.NEXT_DEPLOYMENT_ID || process.env.PRICEAI_VERSION_ID || null;
  const versionTag = process.env.PRICEAI_VERSION_TAG || process.env.npm_package_version || null;

  return Response.json(
    {
      ok: Boolean(versionId),
      platform: "node",
      versionId,
      versionTag,
    },
    {
      status: versionId ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
