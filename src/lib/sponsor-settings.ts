import "server-only";

import {
  createDefaultSponsorSettingsSummary,
  type SponsorPlacementConfig,
  type SponsorPlacementKind,
  type SponsorSettingsSummary,
} from "@/lib/sponsor-settings-shared";

export type SponsorSettingsInput = {
  enabled?: boolean | null;
  placements?: Partial<Record<SponsorPlacementKind, Partial<SponsorPlacementConfig>>> | null;
};

export async function getSponsorSettingsSummary(): Promise<SponsorSettingsSummary> {
  return createDefaultSponsorSettingsSummary({
    configured: false,
    tableReady: false,
    message: "当前使用本地默认赞助位配置。",
  });
}

export function getFallbackSponsorSettingsSummary(message = "当前使用本地默认赞助位配置。"): SponsorSettingsSummary {
  return createDefaultSponsorSettingsSummary({
    configured: false,
    tableReady: false,
    message,
  });
}

export async function updateSponsorSettings(_input: SponsorSettingsInput): Promise<SponsorSettingsSummary> {
  throw new Error("赞助位配置后台已迁移，当前自托管后台暂未开放该设置。");
}
