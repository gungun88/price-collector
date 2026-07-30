import "server-only";

export type AccountDeletionRequest = {
  id: string;
  status: "pending" | "processing" | "cancelled" | "completed" | "rejected";
  requestedAt: string;
  scheduledFor: string;
  cancelledAt: string | null;
  completedAt: string | null;
  resolutionNote: string | null;
};

export async function getActiveAccountDeletionRequest(_userId: string): Promise<AccountDeletionRequest | null> {
  return null;
}

export async function createAccountDeletionRequest(_user: { id: string; email: string | null }): Promise<AccountDeletionRequest> {
  throw new Error("当前自托管版本暂未开放账号中心。");
}

export async function cancelAccountDeletionRequest(_userId: string): Promise<void> {
  return;
}

export async function buildAccountDataExport(user: {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  return {
    exportVersion: 1,
    generatedAt: new Date().toISOString(),
    account: user,
    profile: null,
    feedback: [],
    feedbackFollowups: [],
    detectorJobs: [],
    detectorReportShares: [],
    feedbackEvidenceObjects: [],
    deletionRequests: [],
    notes: ["当前自托管版本暂未开放账号中心。"],
  };
}
