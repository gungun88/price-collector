import "dotenv/config";

const DEFAULT_APP_SECRET = "replace-with-a-long-random-secret-at-least-32-chars";
const DEFAULT_ADMIN_PASSWORD_HASH =
  "scrypt$c6deaffb182895e760d9a10b468f46ea$964f4ed85587081a6f45688f667bc469b606b40a7253bf0a9b23b20805cd947bdda9b6ae43d0845b9c18bd9c647b9b43e96654d96ec4a8d9e12819e6f7edf4e8";

export function getConfig() {
  const port = Number(process.env.PORT || 4100);
  const appSecret = process.env.APP_SECRET || "";
  const adminPasswordHash = readAdminPasswordHash();
  const env = process.env.NODE_ENV || "development";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (appSecret.length < 32) {
    throw new Error("APP_SECRET must be at least 32 characters.");
  }

  if (env === "production") {
    if (appSecret === DEFAULT_APP_SECRET || appSecret.includes("replace-with")) {
      throw new Error("APP_SECRET must be changed before production startup.");
    }
    if (!String(process.env.PRICEAI_FORWARD_SECRET || "").trim()) {
      throw new Error("PRICEAI_FORWARD_SECRET must be configured before production startup.");
    }
    if (String(process.env.DATABASE_URL || "").includes("priceai_dev_password")) {
      throw new Error("DATABASE_URL must use a non-default password before production startup.");
    }
    if (!adminPasswordHash || adminPasswordHash === DEFAULT_ADMIN_PASSWORD_HASH) {
      throw new Error("ADMIN_PASSWORD_HASH_B64 must be changed before production startup.");
    }
  }

  return {
    env,
    host: process.env.HOST || "0.0.0.0",
    port: Number.isFinite(port) ? port : 4100,
    databaseUrl: process.env.DATABASE_URL,
    appSecret,
    adminPasswordHash,
    forwardSecret: process.env.PRICEAI_FORWARD_SECRET || "",
    cookieSecure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && (process.env.NODE_ENV || "development") === "production"),
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  };
}

function readAdminPasswordHash() {
  if (process.env.ADMIN_PASSWORD_HASH) return process.env.ADMIN_PASSWORD_HASH;
  if (!process.env.ADMIN_PASSWORD_HASH_B64) return "";
  return Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64, "base64url").toString("utf8");
}

function parseCorsOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
