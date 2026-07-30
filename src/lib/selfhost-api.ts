import "server-only";

export const SELFHOST_ADMIN_COOKIE = "priceai_selfhost_admin_session";
export const SELFHOST_API_COOKIE = "priceai_admin_session";

const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:4100";

export function getSelfHostedApiBaseUrl(): string {
  const configured = process.env.SELF_HOSTED_API_BASE_URL || process.env.PRICEAI_API_BASE_URL || "";
  const fallback = process.env.NODE_ENV === "development" ? DEFAULT_LOCAL_API_BASE_URL : "";
  const value = (configured || fallback).trim();
  if (!value) throw new Error("SELF_HOSTED_API_BASE_URL is not configured.");
  return value.replace(/\/+$/, "");
}

export function selfHostedApiUrl(path: string): string {
  return new URL(path, getSelfHostedApiBaseUrl()).toString();
}

export function getSelfhostSessionCookie(request: Request): string | null {
  return getCookieValue(request.headers.get("cookie"), SELFHOST_ADMIN_COOKIE);
}

export function selfhostCookieHeaderFromRequest(request: Request): string | null {
  const value = getSelfhostSessionCookie(request);
  return value ? `${SELFHOST_API_COOKIE}=${encodeURIComponent(value)}` : null;
}

export function mapSelfhostSetCookie(header: string | null): string | null {
  if (!header) return null;
  const value = getCookieValue(header, SELFHOST_API_COOKIE);
  if (value === null) return null;

  const maxAge = getCookieAttribute(header, "max-age");
  const expires = getCookieAttribute(header, "expires");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const parts = [
    `${SELFHOST_ADMIN_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
  ];
  if (maxAge) parts.push(`Max-Age=${maxAge}`);
  if (expires) parts.push(`Expires=${expires}`);
  if (secure) parts.push("Secure");
  return parts.filter(Boolean).join("; ");
}

export function clearSelfhostAdminCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SELFHOST_ADMIN_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict${secure}`;
}

export async function readSelfhostJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getCookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  const prefix = `${name}=`;
  const part = header
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : null;
}

function getCookieAttribute(header: string, name: string): string | null {
  const lowerName = name.toLowerCase();
  const part = header
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(`${lowerName}=`));
  return part ? part.slice(part.indexOf("=") + 1) : null;
}
