import { ACCOUNT_DISABLED_MESSAGE, disabledFeatureResponse } from "@/lib/disabled-features";

export function POST() {
  return disabledFeatureResponse(ACCOUNT_DISABLED_MESSAGE);
}
