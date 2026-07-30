import "server-only";

export type TransitCredentialAccessMode = "test_key" | "test_account";

export type TransitCredentialInput = {
  accessMode: TransitCredentialAccessMode;
  submissionId: string;
  stationId?: string | null;
  submitterIp?: string | null;
  budgetLimit?: string | null;
  expiresAt?: string | null;
  allowedModels?: string[];
  allowedGroups?: string[];
  groupName?: string | null;
  groupId?: string | number | null;
  accountPool?: string | null;
  family?: string | null;
  standardModel?: string | null;
  rawModelName?: string | null;
  notes?: string | null;
  apiKey?: string | null;
  loginUrl?: string | null;
  username?: string | null;
  password?: string | null;
};

export async function assertTransitCredentialStorageReady() {
  throw new Error("当前自托管版本暂不接收测试 Key 或测试账号。");
}

export async function createTransitCredential(_input: TransitCredentialInput) {
  throw new Error("当前自托管版本暂不接收测试 Key 或测试账号。");
}
