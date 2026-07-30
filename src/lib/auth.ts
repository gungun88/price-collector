import "server-only";

import { noStoreCacheHeaders } from "@/lib/cache-headers";

export type PriceAiUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export function getAuthConfig(): null {
  return null;
}

export async function getCurrentUser(): Promise<PriceAiUser | null> {
  return null;
}

export async function requireCurrentUser(): Promise<PriceAiUser> {
  throw new AuthRequiredError();
}

export class AuthRequiredError extends Error {
  constructor(message = "当前自托管版本暂未开放用户登录。") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export function authRequiredResponse(message = "当前自托管版本暂未开放用户登录。"): Response {
  return Response.json({ ok: false, code: "auth_disabled", message }, { status: 410, headers: noStoreCacheHeaders() });
}

export async function upsertPublicUserProfile(_user: PriceAiUser): Promise<void> {
  return;
}
