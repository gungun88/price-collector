import "server-only";

export type ExternalApiBudgetClaim = {
  allowed: boolean;
  service: string;
  date: string;
  used: number;
  limit: number;
  remaining: number;
};

export async function claimExternalApiDailyBudget(
  service: string,
  dailyLimit: number,
  units = 1,
): Promise<ExternalApiBudgetClaim> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    allowed: units <= dailyLimit,
    service,
    date: today,
    used: units,
    limit: dailyLimit,
    remaining: Math.max(dailyLimit - units, 0),
  };
}
