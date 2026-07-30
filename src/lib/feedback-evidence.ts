import "server-only";

export const FEEDBACK_EVIDENCE_BUCKET_HOST = "feedback-evidence";
export const FEEDBACK_EVIDENCE_URL_PREFIX = `r2://${FEEDBACK_EVIDENCE_BUCKET_HOST}/`;
export const FEEDBACK_EVIDENCE_MAX_IMAGES = 5;
export const FEEDBACK_EVIDENCE_MAX_BYTES = 4 * 1024 * 1024;
export const FEEDBACK_EVIDENCE_DRAFT_TTL_HOURS = 24;

export type FeedbackEvidenceReadResult = {
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
  contentLength: number | null;
  size: number | null;
  filename: string | null;
};

export async function consumeFeedbackEvidenceUploadQuota(_input: {
  userId: string;
  maxUploads: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return { allowed: false, retryAfterSeconds: 0 };
}

export async function uploadFeedbackEvidenceImage(
  _file: File,
  _input: { userId: string; draftId?: string | null },
): Promise<never> {
  throw new Error("当前自托管版本暂未开放报价反馈图片上传。");
}

export async function assertFeedbackEvidenceOwnership(_references: string[], _userId: string): Promise<void> {
  throw new Error("当前自托管版本暂未开放报价反馈图片上传。");
}

export async function bindFeedbackEvidenceReferences(_input: {
  references: string[];
  userId: string;
  feedbackId: string;
}): Promise<void> {
  throw new Error("当前自托管版本暂未开放报价反馈图片上传。");
}

export async function cleanupExpiredFeedbackEvidenceDrafts(_limit = 100): Promise<{
  scanned: number;
  deleted: number;
  failed: number;
}> {
  return { scanned: 0, deleted: 0, failed: 0 };
}

export async function deleteUserFeedbackEvidence(_userId: string): Promise<{
  deleted: number;
  failed: number;
  remaining: number;
}> {
  return { deleted: 0, failed: 0, remaining: 0 };
}

export async function deleteFeedbackEvidenceDraft(_reference: string, _userId: string): Promise<boolean> {
  return false;
}

export async function readFeedbackEvidenceImage(_reference: string): Promise<FeedbackEvidenceReadResult | null> {
  return null;
}

export function isFeedbackEvidenceReference(value: string): boolean {
  return value.startsWith(FEEDBACK_EVIDENCE_URL_PREFIX);
}
