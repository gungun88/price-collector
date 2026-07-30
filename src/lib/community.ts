import { DEFAULT_COMMUNITY_SETTINGS } from "@/lib/community-settings-shared";

export const qqGroupNumber = DEFAULT_COMMUNITY_SETTINGS.qqGroupNumber;
export const qqGroupUrl = DEFAULT_COMMUNITY_SETTINGS.qqGroupUrl;
export const qqGroupQrCodeUrl = DEFAULT_COMMUNITY_SETTINGS.qqGroupQrCodeUrl;
export const telegramUrl = DEFAULT_COMMUNITY_SETTINGS.telegramUrl;
export const qqGroupPromptEventName = "priceai:qq-group-open";

const qqGroupPromptHashes = new Set(["#qq-group", "#qqgroup"]);

export function wantsQQGroupFromSearch(queryString: string) {
  const params = new URLSearchParams(queryString);
  const qqGroup = params.get("qqGroup");
  if (qqGroup === "1" || qqGroup === "true" || qqGroup === "open") return true;
  return params.get("community") === "qq";
}

export function isQQGroupPromptHash(hash: string) {
  return qqGroupPromptHashes.has(hash.toLowerCase());
}

export function isQQGroupPromptUrl(value: string) {
  try {
    const url = new URL(value, "https://priceai.cc");
    const isInternal = value.startsWith("/") || url.hostname === "priceai.cc" || url.hostname === "www.priceai.cc";
    return isInternal && (wantsQQGroupFromSearch(url.search) || isQQGroupPromptHash(url.hash));
  } catch {
    return false;
  }
}

export function removeQQGroupPromptMarkers(pathname: string, queryString: string, hash: string) {
  const params = new URLSearchParams(queryString);
  params.delete("qqGroup");
  if (params.get("community") === "qq") params.delete("community");

  const nextQuery = params.toString();
  const nextHash = isQQGroupPromptHash(hash) ? "" : hash;
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${nextHash}`;
}
