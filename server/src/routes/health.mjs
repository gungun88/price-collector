import { query } from "../db/pool.mjs";

export async function registerHealthRoutes(app) {
  app.get("/health", async () => {
    const startedAt = Date.now();
    await query("select 1 as ok");
    return {
      ok: true,
      service: "priceai-api",
      database: "ok",
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    };
  });
}
