import { noStoreCacheHeaders } from "@/lib/cache-headers";

export const ACCOUNT_DISABLED_MESSAGE = "当前自托管版本暂未开放用户登录和账号中心。";
export const FEEDBACK_DISABLED_MESSAGE = "当前自托管版本暂未开放报价反馈，后续会接入自托管后台。";
export const LEGACY_ADMIN_DISABLED_MESSAGE = "旧后台接口已停用，请使用 /admin 自托管后台。";
export const LEGACY_CRON_DISABLED_MESSAGE = "旧定时采集接口已停用，后续会改为自托管后台任务。";
export const SITE_FEEDBACK_DISABLED_MESSAGE = "当前自托管版本暂未开放站点反馈，后续会接入自托管后台。";
export const CHANNEL_SUBMISSION_DISABLED_MESSAGE = "当前自托管版本暂未开放普通商品渠道提交，请先使用中转 API 提交渠道。";

export function disabledFeatureResponse(message: string, status = 410): Response {
  return Response.json(
    { ok: false, code: "feature_disabled", message },
    { status, headers: noStoreCacheHeaders() },
  );
}
