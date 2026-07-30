import { z } from "zod";
import {
  adminSessionCookie,
  clearAdminSessionCookie,
  createAdminSession,
  deleteAdminSession,
  getAdminSession,
  verifyAdminPassword,
} from "../services/admin-auth.mjs";
import { getClientFingerprint } from "../utils/request.mjs";

const loginSchema = z.object({
  password: z.string().min(1),
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 8;
const failedLoginAttempts = new Map();

export async function registerAdminAuthRoutes(app) {
  app.post("/api/admin/login", async (request, reply) => {
    const payload = loginSchema.parse(request.body || {});
    const fingerprint = getClientFingerprint(request);
    assertLoginAllowed(fingerprint);

    if (!verifyAdminPassword(payload.password)) {
      recordFailedLogin(fingerprint);
      reply.code(401);
      return { ok: false, message: "Invalid password." };
    }

    clearFailedLogin(fingerprint);
    const session = await createAdminSession(request);
    reply.header("set-cookie", adminSessionCookie(session.token));
    return { ok: true, expiresAt: session.expiresAt.toISOString() };
  });

  app.get("/api/admin/session", async (request) => {
    const session = await getAdminSession(request);
    return {
      ok: true,
      authenticated: Boolean(session),
      expiresAt: session?.expires_at || null,
    };
  });

  app.post("/api/admin/logout", async (request, reply) => {
    await deleteAdminSession(request);
    reply.header("set-cookie", clearAdminSessionCookie());
    return { ok: true };
  });
}

function assertLoginAllowed(fingerprint) {
  const entry = failedLoginAttempts.get(fingerprint);
  if (!entry) return;
  if (entry.resetAt <= Date.now()) {
    failedLoginAttempts.delete(fingerprint);
    return;
  }
  if (entry.count < LOGIN_MAX_FAILURES) return;
  const error = new Error("Too many failed login attempts. Please try again later.");
  error.statusCode = 429;
  throw error;
}

function recordFailedLogin(fingerprint) {
  const now = Date.now();
  const entry = failedLoginAttempts.get(fingerprint);
  if (!entry || entry.resetAt <= now) {
    failedLoginAttempts.set(fingerprint, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

function clearFailedLogin(fingerprint) {
  failedLoginAttempts.delete(fingerprint);
}
