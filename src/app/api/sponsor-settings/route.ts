import { getSponsorSettingsSummary } from "@/lib/sponsor-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SPONSOR_SETTINGS_EDGE_SECONDS = 60;
const SPONSOR_SETTINGS_STALE_SECONDS = 300;
const sponsorSettingsCdnCacheControl = `public, s-maxage=${SPONSOR_SETTINGS_EDGE_SECONDS}, stale-while-revalidate=${SPONSOR_SETTINGS_STALE_SECONDS}`;
const sponsorSettingsCacheHeaders: HeadersInit = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "CDN-Cache-Control": sponsorSettingsCdnCacheControl,
  "Cloudflare-CDN-Cache-Control": sponsorSettingsCdnCacheControl,
  "Vercel-CDN-Cache-Control": sponsorSettingsCdnCacheControl,
};

export async function GET() {
  const settings = await getSponsorSettingsSummary();

  return Response.json(
    { ok: true, settings },
    { headers: sponsorSettingsCacheHeaders },
  );
}
