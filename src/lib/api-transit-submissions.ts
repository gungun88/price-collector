import "server-only";

export type TransitSubmissionType = "user" | "merchant";
export type TransitSubmissionAccessMode = "public_only" | "test_key" | "test_account";

export type CreateTransitSubmissionInput = {
  type: TransitSubmissionType;
  stationId?: string | null;
  url: string;
  name?: string | null;
  apiBaseUrl?: string | null;
  pricingUrl?: string | null;
  contact?: string | null;
  notes?: string | null;
  models?: string[];
  meta?: Record<string, unknown>;
  accessMode?: TransitSubmissionAccessMode | null;
  submitterIp?: string | null;
  rateLimitPerHour?: number;
};

export async function createTransitSubmission(_input: CreateTransitSubmissionInput) {
  throw new Error("旧中转提交写入接口已停用；当前提交已转发到自托管后台。");
}
