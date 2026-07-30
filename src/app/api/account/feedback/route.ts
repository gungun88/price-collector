import { ACCOUNT_DISABLED_MESSAGE, disabledFeatureResponse } from "@/lib/disabled-features";

export function GET() {
  return disabledFeatureResponse(ACCOUNT_DISABLED_MESSAGE);
}

export function POST() {
  return disabledFeatureResponse(ACCOUNT_DISABLED_MESSAGE);
}
