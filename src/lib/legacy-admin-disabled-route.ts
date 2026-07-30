import { LEGACY_ADMIN_DISABLED_MESSAGE, disabledFeatureResponse } from "@/lib/disabled-features";

function disabled() {
  return disabledFeatureResponse(LEGACY_ADMIN_DISABLED_MESSAGE);
}

export const GET = disabled;
export const POST = disabled;
export const PATCH = disabled;
export const DELETE = disabled;
