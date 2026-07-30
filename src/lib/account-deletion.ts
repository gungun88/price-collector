import "server-only";

export type AccountDeletionProcessResult = {
  claimed: number;
  completed: number;
  retried: number;
  evidenceDeleted: number;
  failures: Array<{ requestId: string; message: string }>;
};

export async function processDueAccountDeletions(_input: {
  worker: string;
  limit?: number;
}): Promise<AccountDeletionProcessResult> {
  return {
    claimed: 0,
    completed: 0,
    retried: 0,
    evidenceDeleted: 0,
    failures: [],
  };
}
