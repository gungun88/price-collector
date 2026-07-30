import "server-only";

import {
  createDefaultCommunitySettingsSummary,
  type CommunitySettingsSummary,
} from "@/lib/community-settings-shared";

export type CommunitySettingsInput = {
  qqGroupEnabled?: boolean | null;
  qqGroupNumber?: string | null;
  qqGroupUrl?: string | null;
  qqGroupQrCodeUrl?: string | null;
  telegramEnabled?: boolean | null;
  telegramUrl?: string | null;
};

export async function getCommunitySettingsSummary(): Promise<CommunitySettingsSummary> {
  return createDefaultCommunitySettingsSummary({
    configured: false,
    tableReady: false,
    message: "当前使用本地默认社群配置。",
  });
}

export function getFallbackCommunitySettingsSummary(message = "当前使用本地默认社群配置。"): CommunitySettingsSummary {
  return createDefaultCommunitySettingsSummary({
    configured: false,
    tableReady: false,
    message,
  });
}

export async function updateCommunitySettings(_input: CommunitySettingsInput): Promise<CommunitySettingsSummary> {
  throw new Error("社群配置后台已迁移，当前自托管后台暂未开放该设置。");
}
