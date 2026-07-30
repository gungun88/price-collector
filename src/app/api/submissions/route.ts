import { CHANNEL_SUBMISSION_DISABLED_MESSAGE, disabledFeatureResponse } from "@/lib/disabled-features";

export function POST() {
  return disabledFeatureResponse(CHANNEL_SUBMISSION_DISABLED_MESSAGE);
}
