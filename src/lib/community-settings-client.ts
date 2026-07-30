"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_COMMUNITY_SETTINGS,
  isCommunitySettingsSummary,
  type CommunitySettingsSummary,
} from "@/lib/community-settings-shared";

const communitySettingsCacheKey = "priceai.community-settings.summary.v1";
const communitySettingsCacheVersion = 1;
const communitySettingsCacheFreshAgeMs = 30 * 60 * 1000;
const communitySettingsCacheMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

let memorySettings: CommunitySettingsSummary | null = null;
let inFlightSettings: Promise<CommunitySettingsSummary | null> | null = null;

export function useCommunitySettings(): CommunitySettingsSummary {
  const [settings, setSettings] = useState<CommunitySettingsSummary>(() => {
    return memorySettings || DEFAULT_COMMUNITY_SETTINGS;
  });

  useEffect(() => {
    let cancelled = false;
    const cached = readCachedCommunitySettings();

    if (cached) {
      memorySettings = cached.settings;
      queueMicrotask(() => {
        if (!cancelled) setSettings(cached.settings);
      });
      if (cached.isFresh) {
        return () => {
          cancelled = true;
        };
      }
    }

    void loadCommunitySettings().then((nextSettings) => {
      if (!nextSettings || cancelled) return;
      setSettings(nextSettings);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}

async function loadCommunitySettings(): Promise<CommunitySettingsSummary | null> {
  if (inFlightSettings) return inFlightSettings;

  inFlightSettings = (async () => {
    try {
      const response = await fetch("/api/community-settings");
      if (!response.ok) return null;
      const payload: unknown = await response.json();
      const settings = parseCommunitySettingsResponse(payload);
      if (!settings) return null;

      memorySettings = settings;
      writeCachedCommunitySettings(settings);
      return settings;
    } catch {
      return null;
    } finally {
      inFlightSettings = null;
    }
  })();

  return inFlightSettings;
}

function parseCommunitySettingsResponse(payload: unknown): CommunitySettingsSummary | null {
  if (!isRecord(payload) || payload.ok !== true) return null;
  return isCommunitySettingsSummary(payload.settings) ? payload.settings : null;
}

function readCachedCommunitySettings(): { settings: CommunitySettingsSummary; isFresh: boolean } | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(communitySettingsCacheKey);
    if (!rawValue) return null;

    const payload: unknown = JSON.parse(rawValue);
    if (!isRecord(payload) || payload.version !== communitySettingsCacheVersion) {
      removeCachedCommunitySettings();
      return null;
    }
    if (typeof payload.savedAt !== "string") {
      removeCachedCommunitySettings();
      return null;
    }

    const savedAt = Date.parse(payload.savedAt);
    const cacheAgeMs = Date.now() - savedAt;
    if (!Number.isFinite(savedAt) || cacheAgeMs > communitySettingsCacheMaxAgeMs) {
      removeCachedCommunitySettings();
      return null;
    }

    const settings = payload.settings;
    if (!isCommunitySettingsSummary(settings)) {
      removeCachedCommunitySettings();
      return null;
    }

    return {
      settings,
      isFresh: cacheAgeMs <= communitySettingsCacheFreshAgeMs,
    };
  } catch {
    removeCachedCommunitySettings();
    return null;
  }
}

function writeCachedCommunitySettings(settings: CommunitySettingsSummary) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(communitySettingsCacheKey, JSON.stringify({
      version: communitySettingsCacheVersion,
      savedAt: new Date().toISOString(),
      settings,
    }));
  } catch {
    // localStorage may be unavailable in private or restricted browser contexts.
  }
}

function removeCachedCommunitySettings() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(communitySettingsCacheKey);
  } catch {
    // localStorage may be unavailable in private or restricted browser contexts.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
