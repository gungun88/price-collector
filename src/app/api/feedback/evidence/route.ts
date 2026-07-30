import { FEEDBACK_DISABLED_MESSAGE, disabledFeatureResponse } from "@/lib/disabled-features";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function POST() {
  return disabledFeatureResponse(FEEDBACK_DISABLED_MESSAGE);
}

export function DELETE() {
  return disabledFeatureResponse(FEEDBACK_DISABLED_MESSAGE);
}
