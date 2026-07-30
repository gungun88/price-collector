import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { getConfig } from "../config.mjs";
import { query } from "../db/pool.mjs";
import { parseCookies, serializeCookie } from "../utils/cookies.mjs";
import { stableId } from "../utils/request.mjs";

const config = getConfig();
export const ADMIN_COOKIE_NAME = "priceai_admin_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function verifyAdminPassword(password) {
  if (!config.adminPasswordHash) {
    const error = new Error("ADMIN_PASSWORD_HASH is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const [scheme, salt, expectedHex] = config.adminPasswordHash.split("$");
  if (scheme !== "scrypt" || !salt || !expectedHex) {
    throw new Error("ADMIN_PASSWORD_HASH format is invalid.");
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(String(password || ""), salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createAdminSession(request) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashAdminToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await query(
    `insert into admin_sessions (id, token_hash, expires_at, ip, user_agent)
     values ($1, $2, $3, $4, $5)`,
    [
      stableId("as", tokenHash, expiresAt.toISOString()),
      tokenHash,
      expiresAt.toISOString(),
      request.ip || null,
      String(request.headers["user-agent"] || "").slice(0, 240) || null,
    ],
  );
  return { token, expiresAt };
}

export async function getAdminSession(request) {
  const token = parseCookies(request.headers.cookie).get(ADMIN_COOKIE_NAME);
  if (!token) return null;
  const tokenHash = hashAdminToken(token);
  const result = await query(
    `update admin_sessions
     set last_seen_at = now()
     where token_hash = $1 and expires_at > now()
     returning id, expires_at`,
    [tokenHash],
  );
  return result.rows[0] || null;
}

export async function requireAdmin(request) {
  const session = await getAdminSession(request);
  if (session) return session;
  const error = new Error("Unauthorized.");
  error.statusCode = 401;
  throw error;
}

export async function deleteAdminSession(request) {
  const token = parseCookies(request.headers.cookie).get(ADMIN_COOKIE_NAME);
  if (!token) return;
  await query("delete from admin_sessions where token_hash = $1", [hashAdminToken(token)]);
}

export function adminSessionCookie(token) {
  return serializeCookie(ADMIN_COOKIE_NAME, token, {
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "Lax",
    secure: config.cookieSecure,
  });
}

export function clearAdminSessionCookie() {
  return serializeCookie(ADMIN_COOKIE_NAME, "", {
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "Lax",
    secure: config.cookieSecure,
  });
}

function hashAdminToken(token) {
  return createHmac("sha256", config.appSecret).update(String(token || "")).digest("hex");
}
