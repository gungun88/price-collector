import Fastify from "fastify";
import cors from "@fastify/cors";
import { getConfig } from "./config.mjs";
import { closePool } from "./db/pool.mjs";
import { registerHealthRoutes } from "./routes/health.mjs";
import { registerAdminAuthRoutes } from "./routes/admin-auth.mjs";
import { registerAdminTransitRoutes } from "./routes/admin-transit.mjs";
import { registerTransitStationRoutes } from "./routes/transit-stations.mjs";
import { registerTransitSubmissionRoutes } from "./routes/transit-submissions.mjs";

const config = getConfig();
const app = Fastify({
  logger: true,
  trustProxy: true,
  bodyLimit: 64 * 1024,
});

if (config.corsOrigins.length) {
  await app.register(cors, {
    origin: config.corsOrigins,
  });
}

app.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || (error.name === "ZodError" ? 400 : 500);
  if (statusCode >= 500) request.log.error(error);
  reply.code(statusCode).send({
    ok: false,
    message: statusCode >= 500 ? "Internal server error." : error.message,
  });
});

await registerHealthRoutes(app);
await registerTransitSubmissionRoutes(app);
await registerTransitStationRoutes(app);
await registerAdminAuthRoutes(app);
await registerAdminTransitRoutes(app);

const shutdown = async () => {
  app.log.info("shutting down");
  await app.close();
  await closePool();
};

process.on("SIGINT", () => shutdown().then(() => process.exit(0)));
process.on("SIGTERM", () => shutdown().then(() => process.exit(0)));

await app.listen({ host: config.host, port: config.port });
