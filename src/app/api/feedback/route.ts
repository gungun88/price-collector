import { FEEDBACK_DISABLED_MESSAGE, disabledFeatureResponse } from "@/lib/disabled-features";

export function POST() {
  return disabledFeatureResponse(FEEDBACK_DISABLED_MESSAGE);
}
