import { SITE_FEEDBACK_DISABLED_MESSAGE, disabledFeatureResponse } from "@/lib/disabled-features";

export function POST() {
  return disabledFeatureResponse(SITE_FEEDBACK_DISABLED_MESSAGE);
}
