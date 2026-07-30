import "server-only";

import crypto from "node:crypto";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const ADMIN_SESSION_COOKIE = "priceai_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const MIN_ADMIN_PASSWORD_LENGTH = 8;

export type AdminPasswordStatus = {
  configured: boolean;
  tableReady: boolean;
  source: "environment" | "unconfigured";
  minLength: number;
  updatedAt: string | null;
  message: string | null;
};

export async function createAdminSessionToken(): Promise<string> {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const nonce = crypto.randomBytes(16).toString("base64url");
  const version = getAdminSessionVersion();
  const payload = [version, String(expiresAt), nonce].join(".");
  return `${payload}.${signAdminSessionPayload(payload)}`;
}

export async function verifyAdminSessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, expiresAtText, nonce, signature] = parts;
  if (!version || !expiresAtText || !nonce || !signature) return false;
  if (version !== getAdminSessionVersion()) return false;

  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const payload = [version, expiresAtText, nonce].join(".");
  const expected = signAdminSessionPayload(payload, { throwOnMissingSecret: false });
  return Boolean(expected && timingSafeEqual(signature, expected));
}

export async function verifyAdminPassword(value: string | null | undefined): Promise<boolean> {
  const password = cleanPassword(value);
  if (!password) return false;

  const configured = getRuntimeEnv("ADMIN_PASSWORD");
  const breakGlass = getRuntimeEnv("ADMIN_BREAK_GLASS_PASSWORD");
  return Boolean(
    (configured && timingSafeEqual(password, configured)) ||
    (isBreakGlassEnabled() && breakGlass && timingSafeEqual(password, breakGlass)),
  );
}

export async function requireAdminRequest(request: Request): Promise<void> {
  if (await isAdminRequest(request)) return;
  throw new Error("未授权，请先登录后台。");
}

export async function requireAdminOrCronRequest(request: Request): Promise<void> {
  const cronSecret = getRuntimeEnv("CRON_SECRET");
  const token = getBearerTokenFromRequest(request) ||
    request.headers.get("x-cron-secret")?.trim() ||
    request.headers.get("x-admin-password")?.trim() ||
    null;
  if (token && cronSecret && timingSafeEqual(token, cronSecret)) return;
  if (await isAdminRequest(request)) return;
  throw new Error("未授权，请检查后台登录状态或定时任务密钥。");
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const cookieToken = getAdminSessionTokenFromRequest(request);
  if (cookieToken && await verifyAdminSessionToken(cookieToken)) return true;

  const headerPassword = request.headers.get("x-admin-password")?.trim();
  if (headerPassword && await verifyAdminPassword(headerPassword)) return true;

  const bearer = getBearerTokenFromRequest(request);
  return Boolean(bearer && await verifyAdminPassword(bearer));
}

export async function updateAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AdminPasswordStatus> {
  const currentPassword = cleanPassword(input.currentPassword);
  if (!await verifyAdminPassword(currentPassword)) throw new Error("当前后台密码不正确。");
  throw new Error("当前自托管版本使用环境变量 ADMIN_PASSWORD 管理后台密码，请在服务器环境变量中修改后重启服务。");
}

export async function getAdminPasswordStatus(): Promise<AdminPasswordStatus> {
  const envConfigured = Boolean(getRuntimeEnv("ADMIN_PASSWORD"));
  const breakGlassEnabled = isBreakGlassEnabled();
  return {
    configured: envConfigured || breakGlassEnabled,
    tableReady: false,
    source: envConfigured || breakGlassEnabled ? "environment" : "unconfigured",
    minLength: MIN_ADMIN_PASSWORD_LENGTH,
    updatedAt: null,
    message: envConfigured
      ? "当前后台密码来自环境变量 ADMIN_PASSWORD。"
      : breakGlassEnabled
        ? "当前仅允许 break-glass 后台密码登录。"
        : "尚未配置后台密码，请设置 ADMIN_PASSWORD。",
  };
}

function getAdminSessionTokenFromRequest(request: Request): string | null {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(ADMIN_SESSION_COOKIE.length + 1);
  return cookie ? decodeURIComponent(cookie) : null;
}

function getBearerTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

function getAdminSessionVersion(): string {
  return getRuntimeEnv("ADMIN_SESSION_VERSION") || "1";
}

function signAdminSessionPayload(
  payload: string,
  { throwOnMissingSecret = true }: { throwOnMissingSecret?: boolean } = {},
): string | null {
  const secret = getAdminSessionSecret({ throwOnMissingSecret });
  if (!secret) return null;
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

function getAdminSessionSecret(
  { throwOnMissingSecret = true }: { throwOnMissingSecret?: boolean } = {},
): string | null {
  const secret = getRuntimeEnv("ADMIN_SESSION_SECRET") || getRuntimeEnv("ADMIN_PASSWORD");
  if (secret) return secret;
  if (!throwOnMissingSecret) return null;
  throw new Error("ADMIN_SESSION_SECRET is not configured.");
}

function isBreakGlassEnabled(): boolean {
  return getRuntimeEnv("ADMIN_BREAK_GLASS_ENABLED")?.trim().toLowerCase() === "true" &&
    Boolean(getRuntimeEnv("ADMIN_BREAK_GLASS_PASSWORD"));
}

function cleanPassword(value: string | null | undefined): string {
  return String(value || "").trim();
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
