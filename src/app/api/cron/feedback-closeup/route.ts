import { LEGACY_CRON_DISABLED_MESSAGE, disabledFeatureResponse } from "@/lib/disabled-features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function disabled() {
  return disabledFeatureResponse(LEGACY_CRON_DISABLED_MESSAGE);
}

export const GET = disabled;
export const POST = disabled;
