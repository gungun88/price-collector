import { getCommunitySettingsSummary } from "@/lib/community-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COMMUNITY_SETTINGS_EDGE_SECONDS = 60;
const COMMUNITY_SETTINGS_STALE_SECONDS = 300;
const communitySettingsCdnCacheControl = `public, s-maxage=${COMMUNITY_SETTINGS_EDGE_SECONDS}, stale-while-revalidate=${COMMUNITY_SETTINGS_STALE_SECONDS}`;
const communitySettingsCacheHeaders: HeadersInit = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "CDN-Cache-Control": communitySettingsCdnCacheControl,
  "Cloudflare-CDN-Cache-Control": communitySettingsCdnCacheControl,
  "Vercel-CDN-Cache-Control": communitySettingsCdnCacheControl,
};

export async function GET() {
  const settings = await getCommunitySettingsSummary();

  return Response.json(
    { ok: true, settings },
    { headers: communitySettingsCacheHeaders },
  );
}
