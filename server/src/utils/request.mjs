import { createHmac } from "node:crypto";
import { getConfig } from "../config.mjs";

const config = getConfig();

export function getClientFingerprint(request) {
  const forwardedFingerprint = String(request.headers["x-priceai-client-fingerprint"] || "").trim();
  const forwardSecret = String(request.headers["x-priceai-forward-secret"] || "");
  if (
    forwardedFingerprint &&
    forwardedFingerprint.length <= 160 &&
    config.forwardSecret &&
    forwardSecret === config.forwardSecret
  ) {
    return forwardedFingerprint;
  }

  const forwarded = request.headers["x-forwarded-for"];
  const realIp = request.headers["x-real-ip"];
  const rawIp = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || realIp || request.ip || "unknown").split(",")[0].trim();
  const userAgent = String(request.headers["user-agent"] || "").slice(0, 240);
  return createHmac("sha256", config.appSecret)
    .update(`${rawIp}|${userAgent}`)
    .digest("hex");
}

export function normalizeHttpUrl(value) {
  const url = new URL(String(value || "").trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("URL only supports http or https.");
  }
  url.hash = "";
  return url.toString();
}

export function normalizeSubmissionUrl(value) {
  const normalizedUrl = normalizeHttpUrl(value);
  const url = new URL(normalizedUrl);
  const normalizedHost = url.hostname.toLowerCase().replace(/^www\./, "");
  url.searchParams.sort();
  return {
    submittedUrl: normalizedUrl,
    normalizedUrl: url.toString(),
    normalizedHost,
  };
}

export function cleanText(value) {
  const text = String(value || "").trim();
  return text ? text : null;
}

export function uniqueTextList(values, limit = 30) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))).slice(0, limit);
}

export function stableId(prefix, ...parts) {
  const hash = createHmac("sha256", config.appSecret)
    .update(parts.map((part) => String(part ?? "")).join("\u001f"))
    .digest("hex")
    .slice(0, 24);
  return `${prefix}_${hash}`;
}
