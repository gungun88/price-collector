import { z } from "zod";
import { pool, query } from "../db/pool.mjs";
import { requireAdmin } from "../services/admin-auth.mjs";
import { cleanText, stableId } from "../utils/request.mjs";

const TRANSIT_STANDARD_MODELS = [
  "Claude Fable 5",
  "Claude Sonnet 5",
  "Claude Sonnet 4.5",
  "Claude Sonnet 4.6",
  "Claude Haiku 4.5",
  "Claude Opus 4.5",
  "Claude Opus 4.6",
  "Claude Opus 4.7",
  "Claude Opus 4.8",
  "Codex Compact",
  "GPT 5.6 Sol",
  "GPT 5.6 Terra",
  "GPT 5.6 Luna",
  "GPT 5.5",
  "GPT 5.4",
  "GPT 5.4 Mini",
  "Gemini 3.5 Flash",
  "Gemini 3.1 Pro",
  "Grok 4.20",
  "Grok 4.3",
  "Grok 4.5",
  "Grok Build",
  "Composer 2.5",
  "GLM-5.2",
  "GLM-5.1",
  "DeepSeek V4 Flash",
  "DeepSeek V4 Pro",
  "GPT Image 2",
  "Grok Image",
  "Nano Banana Pro",
  "Nano Banana 2",
  "Nano Banana",
  "Nano Banana Lite",
  "Sora 2",
  "Sora 2 Pro",
  "Grok Video",
  "Veo 3.1",
  "Veo 3.1 Lite",
  "Gemini Omni Flash",
  "Seedance 2.0",
  "Kling 2.5 Turbo",
];

const TRANSIT_STANDARD_MODEL_FAMILY = {
  "Claude Fable 5": "claude",
  "Claude Sonnet 5": "claude",
  "Claude Sonnet 4.5": "claude",
  "Claude Sonnet 4.6": "claude",
  "Claude Haiku 4.5": "claude",
  "Claude Opus 4.5": "claude",
  "Claude Opus 4.6": "claude",
  "Claude Opus 4.7": "claude",
  "Claude Opus 4.8": "claude",
  "Codex Compact": "gpt",
  "GPT 5.6 Sol": "gpt",
  "GPT 5.6 Terra": "gpt",
  "GPT 5.6 Luna": "gpt",
  "GPT 5.5": "gpt",
  "GPT 5.4": "gpt",
  "GPT 5.4 Mini": "gpt",
  "Gemini 3.5 Flash": "gemini",
  "Gemini 3.1 Pro": "gemini",
  "Grok 4.20": "grok",
  "Grok 4.3": "grok",
  "Grok 4.5": "grok",
  "Grok Build": "grok",
  "Composer 2.5": "grok",
  "GLM-5.2": "glm",
  "GLM-5.1": "glm",
  "DeepSeek V4 Flash": "deepseek",
  "DeepSeek V4 Pro": "deepseek",
  "GPT Image 2": "image",
  "Grok Image": "grok",
  "Nano Banana Pro": "image",
  "Nano Banana 2": "image",
  "Nano Banana": "image",
  "Nano Banana Lite": "image",
  "Sora 2": "video",
  "Sora 2 Pro": "video",
  "Grok Video": "grok",
  "Veo 3.1": "video",
  "Veo 3.1 Lite": "video",
  "Gemini Omni Flash": "video",
  "Seedance 2.0": "video",
  "Kling 2.5 Turbo": "video",
};

const listQuerySchema = z.object({
  status: z.enum(["pending", "collector_todo", "approved", "rejected", "all"]).default("pending"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const updateSchema = z.object({
  reviewStatus: z.enum(["pending", "collector_todo", "approved", "rejected"]),
  stationId: z.string().trim().min(1).max(120).optional().nullable(),
  adminNote: z.string().trim().max(1000).optional().nullable(),
});

const stationListQuerySchema = z.object({
  bucket: z.enum(["pending", "published", "removed", "all"]).default("all"),
  q: z.string().trim().max(120).optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const stationUpdateSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  websiteUrl: z.string().url().max(2048).optional(),
  logoUrl: z.string().url().max(2048).optional().nullable(),
  apiBaseUrl: z.string().url().max(2048).optional().nullable(),
  pricingUrl: z.string().url().max(2048).optional().nullable(),
  monitorUrl: z.string().url().max(2048).optional().nullable(),
  summary: z.string().trim().max(1200).optional().nullable(),
  status: z.enum(["unknown", "active", "risky", "inactive"]).optional(),
  published: z.boolean().optional(),
  sourceType: z.string().trim().max(80).optional(),
  commercialRelation: z.enum(["unknown", "none", "partner", "sponsor"]).optional(),
  stationSystem: z.enum(["new_api", "sub_to_api", "custom", "unknown"]).optional(),
  operatorType: z.enum(["company", "individual", "unknown"]).optional(),
  invoiceSupport: z.enum(["supported", "unsupported", "unknown"]).optional(),
  channelTypes: z.array(z.string().trim().max(80)).max(30).optional(),
  accountPools: z.array(z.string().trim().max(80)).max(30).optional(),
  paymentMethods: z.array(z.string().trim().max(80)).max(30).optional(),
  supportChannels: z.array(z.string().trim().max(80)).max(30).optional(),
  riskLabels: z.array(z.string().trim().max(80)).max(30).optional(),
  minimumTopUp: z.string().trim().max(200).optional().nullable(),
  balanceExpiry: z.string().trim().max(200).optional().nullable(),
  refundPolicy: z.string().trim().max(500).optional().nullable(),
  strengths: z.array(z.string().trim().max(160)).max(20).optional(),
  cautions: z.array(z.string().trim().max(160)).max(20).optional(),
  usageAdvice: z.enum(["pending", "trial_only", "normal", "avoid"]).optional(),
  dataStatus: z.enum(["pending_review", "verified", "stale"]).optional(),
  adminNote: z.string().trim().max(1000).optional().nullable(),
});

const stationCreateSchema = stationUpdateSchema.omit({ id: true }).extend({
  id: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(120).optional(),
  websiteUrl: z.string().url().max(2048),
});

const stationRemoveSchema = z.object({
  removedReason: z.string().trim().max(500).optional().nullable(),
});

const offerListQuerySchema = z.object({
  stationId: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["active", "needs_review", "inactive", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(300).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const offerBaseSchema = z.object({
  id: z.string().trim().min(1).max(160).optional(),
  stationId: z.string().trim().min(1).max(120),
  family: z.enum(["gpt", "claude", "gemini", "grok", "glm", "deepseek", "image", "video"]),
  standardModel: z.enum(TRANSIT_STANDARD_MODELS),
  rawModelName: z.string().trim().max(200).optional().nullable(),
  groupName: z.string().trim().min(1).max(120).default("default"),
  rechargeRatio: z.string().trim().max(120).optional().nullable(),
  modelMultiplier: z.coerce.number().finite().optional().nullable(),
  inputPrice: z.coerce.number().finite().optional().nullable(),
  outputPrice: z.coerce.number().finite().optional().nullable(),
  cacheReadPrice: z.coerce.number().finite().optional().nullable(),
  cacheWritePrice: z.coerce.number().finite().optional().nullable(),
  fixedPrice: z.coerce.number().finite().optional().nullable(),
  fixedPriceUnit: z.string().trim().max(80).optional().nullable(),
  currency: z.enum(["CNY"]).default("CNY"),
  accountPool: z.string().trim().max(80).optional().nullable(),
  channelType: z.string().trim().max(80).optional().nullable(),
  priceSource: z.string().trim().max(300).optional().nullable(),
  status: z.enum(["active", "needs_review", "inactive"]).default("needs_review"),
  lastVerifiedAt: z.string().datetime().optional().nullable(),
});

const offerWriteSchema = offerBaseSchema.refine(
  (value) => transitStandardModelMatchesFamily(value.standardModel, value.family),
  {
    message: "Standard model does not match model family.",
    path: ["standardModel"],
  },
);

const offerPatchSchema = offerBaseSchema.partial().extend({
  id: z.string().trim().min(1).max(160),
}).refine(
  (value) => !value.standardModel || !value.family || transitStandardModelMatchesFamily(value.standardModel, value.family),
  {
    message: "Standard model does not match model family.",
    path: ["standardModel"],
  },
);

export async function registerAdminTransitRoutes(app) {
  app.get("/api/admin/transit/offers", async (request) => {
    await requireAdmin(request);
    const params = offerListQuerySchema.parse(request.query || {});
    const values = [];
    const clauses = [];
    if (params.stationId) {
      values.push(params.stationId);
      clauses.push(`station_id = $${values.length}`);
    }
    if (params.status !== "all") {
      values.push(params.status);
      clauses.push(`status = $${values.length}`);
    }
    values.push(params.limit, params.offset);
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    const result = await query(
      `select * from api_transit_offers
       ${where}
       order by coalesce(last_verified_at, updated_at, created_at) desc
       limit $${values.length - 1} offset $${values.length}`,
      values,
    );
    return { ok: true, offers: result.rows.map(mapOffer) };
  });

  app.post("/api/admin/transit/offers", async (request) => {
    await requireAdmin(request);
    const payload = offerWriteSchema.parse(request.body || {});
    const offer = await createOffer(payload);
    return { ok: true, offer: mapOffer(offer) };
  });

  app.patch("/api/admin/transit/offers/:id", async (request) => {
    await requireAdmin(request);
    const id = String(request.params.id || "").trim();
    const payload = offerPatchSchema.parse({ ...(request.body || {}), id });
    const offer = await updateOffer(payload);
    return { ok: true, offer: mapOffer(offer) };
  });

  app.get("/api/admin/transit/stations", async (request) => {
    await requireAdmin(request);
    const params = stationListQuerySchema.parse(request.query || {});
    const values = [];
    const clauses = [];
    if (params.bucket === "pending") clauses.push("published = false and removed_at is null");
    if (params.bucket === "published") clauses.push("published = true and removed_at is null");
    if (params.bucket === "removed") clauses.push("removed_at is not null");
    if (params.q) {
      values.push(`%${params.q.toLowerCase()}%`);
      clauses.push(`(lower(name) like $${values.length} or lower(slug) like $${values.length} or lower(website_url) like $${values.length})`);
    }
    values.push(params.limit, params.offset);
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    const result = await query(
      `select s.*,
        count(o.id)::int as offer_count,
        count(o.id) filter (where o.status = 'active')::int as active_offer_count,
        count(o.id) filter (where o.status = 'needs_review')::int as pending_offer_count
       from api_transit_stations s
       left join api_transit_offers o on o.station_id = s.id
       ${where}
       group by s.id
       order by s.updated_at desc
       limit $${values.length - 1} offset $${values.length}`,
      values,
    );
    return { ok: true, stations: result.rows.map(mapStation) };
  });

  app.post("/api/admin/transit/stations", async (request) => {
    await requireAdmin(request);
    const payload = stationCreateSchema.parse(request.body || {});
    const station = await createStation(payload);
    return { ok: true, station: mapStation(station) };
  });

  app.patch("/api/admin/transit/stations/:id", async (request) => {
    await requireAdmin(request);
    const id = String(request.params.id || "").trim();
    const payload = stationUpdateSchema.parse({ ...(request.body || {}), id });
    const station = await updateStation(payload);
    return { ok: true, station: mapStation(station) };
  });

  app.delete("/api/admin/transit/stations/:id", async (request) => {
    await requireAdmin(request);
    const id = String(request.params.id || "").trim();
    if (!id) {
      const error = new Error("Station id is required.");
      error.statusCode = 400;
      throw error;
    }
    const payload = stationRemoveSchema.parse(request.body || {});
    const station = await removeStation(id, payload.removedReason);
    return { ok: true, station: mapStation(station) };
  });

  app.post("/api/admin/transit/stations/:id/restore", async (request) => {
    await requireAdmin(request);
    const id = String(request.params.id || "").trim();
    if (!id) {
      const error = new Error("Station id is required.");
      error.statusCode = 400;
      throw error;
    }
    const station = await restoreStation(id);
    return { ok: true, station: mapStation(station) };
  });

  app.get("/api/admin/transit/submissions", async (request) => {
    await requireAdmin(request);
    const params = listQuerySchema.parse(request.query || {});
    const values = [];
    let where = "";
    if (params.status !== "all") {
      values.push(params.status);
      where = `where review_status = $${values.length}`;
    }
    values.push(params.limit, params.offset);
    const limitParam = `$${values.length - 1}`;
    const offsetParam = `$${values.length}`;
    const result = await query(
      `select * from api_transit_submissions
       ${where}
       order by created_at desc
       limit ${limitParam} offset ${offsetParam}`,
      values,
    );
    return { ok: true, submissions: result.rows.map(mapSubmission) };
  });

  app.patch("/api/admin/transit/submissions/:id", async (request) => {
    await requireAdmin(request);
    const payload = updateSchema.parse(request.body || {});
    const id = String(request.params.id || "").trim();
    if (!id) {
      const error = new Error("Submission id is required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await updateSubmissionReview(id, payload);
    return { ok: true, ...result };
  });
}

async function createStation(payload) {
  const generatedSlug = slugify(payload.slug || payload.name);
  const slug = generatedSlug || stableId("station", payload.websiteUrl, payload.name).replace(/^station_/, "station-");
  const id = slugify(payload.id || slug) || slug;
  const existing = await query(
    "select id from api_transit_stations where id = $1 or slug = $2 limit 1",
    [id, slug],
  );
  if (existing.rows[0]) {
    const error = new Error("Station id or slug already exists.");
    error.statusCode = 409;
    throw error;
  }

  const result = await query(
    `insert into api_transit_stations (
      id, slug, name, website_url, logo_url, api_base_url, pricing_url, monitor_url,
      summary, status, published, source_type, commercial_relation, station_system,
      operator_type, invoice_support, channel_types, account_pools, payment_methods,
      support_channels, risk_labels, minimum_top_up, balance_expiry, refund_policy,
      strengths, cautions, usage_advice, data_status, admin_note, last_updated_at
    ) values (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19,
      $20, $21, $22, $23, $24,
      $25, $26, $27, $28, $29, now()
    )
    returning *`,
    [
      id,
      slug,
      payload.name,
      normalizeStationUrl(payload.websiteUrl),
      cleanOptionalUrl(payload.logoUrl),
      cleanOptionalUrl(payload.apiBaseUrl),
      cleanOptionalUrl(payload.pricingUrl),
      cleanOptionalUrl(payload.monitorUrl),
      cleanText(payload.summary) || "",
      payload.status || "unknown",
      payload.published ?? false,
      cleanText(payload.sourceType) || "manual",
      payload.commercialRelation || "unknown",
      payload.stationSystem || "unknown",
      payload.operatorType || "unknown",
      payload.invoiceSupport || "unknown",
      cleanTextArray(payload.channelTypes),
      cleanTextArray(payload.accountPools),
      cleanTextArray(payload.paymentMethods),
      cleanTextArray(payload.supportChannels),
      cleanTextArray(payload.riskLabels),
      cleanText(payload.minimumTopUp),
      cleanText(payload.balanceExpiry),
      cleanText(payload.refundPolicy),
      cleanTextArray(payload.strengths),
      cleanTextArray(payload.cautions),
      payload.usageAdvice || "pending",
      payload.dataStatus || "pending_review",
      cleanText(payload.adminNote),
    ],
  );
  return result.rows[0];
}

async function updateStation(payload) {
  const fields = [];
  const values = [];
  const set = (column, value) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (payload.name !== undefined) set("name", payload.name);
  if (payload.slug !== undefined) {
    const nextSlug = slugify(payload.slug);
    if (!nextSlug) {
      const error = new Error("Slug must contain at least one Latin letter or number.");
      error.statusCode = 400;
      throw error;
    }
    set("slug", nextSlug);
  }
  if (payload.websiteUrl !== undefined) set("website_url", normalizeStationUrl(payload.websiteUrl));
  if (payload.logoUrl !== undefined) set("logo_url", cleanOptionalUrl(payload.logoUrl));
  if (payload.apiBaseUrl !== undefined) set("api_base_url", cleanOptionalUrl(payload.apiBaseUrl));
  if (payload.pricingUrl !== undefined) set("pricing_url", cleanOptionalUrl(payload.pricingUrl));
  if (payload.monitorUrl !== undefined) set("monitor_url", cleanOptionalUrl(payload.monitorUrl));
  if (payload.summary !== undefined) set("summary", cleanText(payload.summary) || "");
  if (payload.status !== undefined) set("status", payload.status);
  if (payload.published !== undefined) set("published", payload.published);
  if (payload.sourceType !== undefined) set("source_type", cleanText(payload.sourceType) || "manual");
  if (payload.commercialRelation !== undefined) set("commercial_relation", payload.commercialRelation);
  if (payload.stationSystem !== undefined) set("station_system", payload.stationSystem);
  if (payload.operatorType !== undefined) set("operator_type", payload.operatorType);
  if (payload.invoiceSupport !== undefined) set("invoice_support", payload.invoiceSupport);
  if (payload.channelTypes !== undefined) set("channel_types", cleanTextArray(payload.channelTypes));
  if (payload.accountPools !== undefined) set("account_pools", cleanTextArray(payload.accountPools));
  if (payload.paymentMethods !== undefined) set("payment_methods", cleanTextArray(payload.paymentMethods));
  if (payload.supportChannels !== undefined) set("support_channels", cleanTextArray(payload.supportChannels));
  if (payload.riskLabels !== undefined) set("risk_labels", cleanTextArray(payload.riskLabels));
  if (payload.minimumTopUp !== undefined) set("minimum_top_up", cleanText(payload.minimumTopUp));
  if (payload.balanceExpiry !== undefined) set("balance_expiry", cleanText(payload.balanceExpiry));
  if (payload.refundPolicy !== undefined) set("refund_policy", cleanText(payload.refundPolicy));
  if (payload.strengths !== undefined) set("strengths", cleanTextArray(payload.strengths));
  if (payload.cautions !== undefined) set("cautions", cleanTextArray(payload.cautions));
  if (payload.usageAdvice !== undefined) set("usage_advice", payload.usageAdvice);
  if (payload.dataStatus !== undefined) set("data_status", payload.dataStatus);
  if (payload.adminNote !== undefined) set("admin_note", cleanText(payload.adminNote));
  set("last_updated_at", new Date().toISOString());

  values.push(payload.id);
  const result = await query(
    `update api_transit_stations
     set ${fields.join(", ")}
     where id = $${values.length}
     returning *`,
    values,
  );
  if (!result.rows[0]) {
    const error = new Error("Station not found.");
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

async function removeStation(id, removedReason) {
  const result = await query(
    `update api_transit_stations
     set published = false,
         removed_at = now(),
         removed_reason = $2,
         last_updated_at = now()
     where id = $1
     returning *`,
    [id, cleanText(removedReason) || "Admin removed"],
  );
  if (!result.rows[0]) throwNotFound("Station not found.");
  return result.rows[0];
}

async function restoreStation(id) {
  const result = await query(
    `update api_transit_stations
     set removed_at = null,
         removed_reason = null,
         published = false,
         last_updated_at = now()
     where id = $1
     returning *`,
    [id],
  );
  if (!result.rows[0]) throwNotFound("Station not found.");
  return result.rows[0];
}

async function createOffer(payload) {
  const id = payload.id || offerId(payload.stationId, payload.standardModel, payload.groupName);
  const result = await query(
    `insert into api_transit_offers (
      id, station_id, family, standard_model, raw_model_name, group_name,
      recharge_ratio, model_multiplier, input_price, output_price, cache_read_price, cache_write_price,
      fixed_price, fixed_price_unit, currency, account_pool, channel_type, price_source,
      status, last_verified_at
    ) values (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18,
      $19, $20
    )
    on conflict (station_id, standard_model, group_name) do update set
      family = excluded.family,
      raw_model_name = excluded.raw_model_name,
      recharge_ratio = excluded.recharge_ratio,
      model_multiplier = excluded.model_multiplier,
      input_price = excluded.input_price,
      output_price = excluded.output_price,
      cache_read_price = excluded.cache_read_price,
      cache_write_price = excluded.cache_write_price,
      fixed_price = excluded.fixed_price,
      fixed_price_unit = excluded.fixed_price_unit,
      currency = excluded.currency,
      account_pool = excluded.account_pool,
      channel_type = excluded.channel_type,
      price_source = excluded.price_source,
      status = excluded.status,
      last_verified_at = excluded.last_verified_at
    returning *`,
    offerValues({ ...payload, id }),
  );
  await touchStation(payload.stationId);
  return result.rows[0];
}

async function updateOffer(payload) {
  const fields = [];
  const values = [];
  const set = (column, value) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (payload.standardModel !== undefined || payload.family !== undefined) {
    const current = await query("select family, standard_model from api_transit_offers where id = $1", [payload.id]);
    if (!current.rows[0]) throwNotFound("Offer not found.");
    const nextFamily = payload.family || current.rows[0].family;
    const nextStandardModel = payload.standardModel || current.rows[0].standard_model;
    if (!transitStandardModelMatchesFamily(nextStandardModel, nextFamily)) {
      const error = new Error("Standard model does not match model family.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (payload.stationId !== undefined) set("station_id", payload.stationId);
  if (payload.family !== undefined) set("family", payload.family);
  if (payload.standardModel !== undefined) set("standard_model", payload.standardModel);
  if (payload.rawModelName !== undefined) set("raw_model_name", cleanText(payload.rawModelName));
  if (payload.groupName !== undefined) set("group_name", cleanText(payload.groupName) || "default");
  if (payload.rechargeRatio !== undefined) set("recharge_ratio", cleanText(payload.rechargeRatio));
  if (payload.modelMultiplier !== undefined) set("model_multiplier", payload.modelMultiplier);
  if (payload.inputPrice !== undefined) set("input_price", payload.inputPrice);
  if (payload.outputPrice !== undefined) set("output_price", payload.outputPrice);
  if (payload.cacheReadPrice !== undefined) set("cache_read_price", payload.cacheReadPrice);
  if (payload.cacheWritePrice !== undefined) set("cache_write_price", payload.cacheWritePrice);
  if (payload.fixedPrice !== undefined) set("fixed_price", payload.fixedPrice);
  if (payload.fixedPriceUnit !== undefined) set("fixed_price_unit", cleanText(payload.fixedPriceUnit));
  if (payload.currency !== undefined) set("currency", payload.currency);
  if (payload.accountPool !== undefined) set("account_pool", cleanText(payload.accountPool));
  if (payload.channelType !== undefined) set("channel_type", cleanText(payload.channelType));
  if (payload.priceSource !== undefined) set("price_source", cleanText(payload.priceSource));
  if (payload.status !== undefined) set("status", payload.status);
  if (payload.lastVerifiedAt !== undefined) set("last_verified_at", payload.lastVerifiedAt);

  if (!fields.length) {
    const result = await query("select * from api_transit_offers where id = $1", [payload.id]);
    if (!result.rows[0]) throwNotFound("Offer not found.");
    return result.rows[0];
  }

  values.push(payload.id);
  const result = await query(
    `update api_transit_offers
     set ${fields.join(", ")}
     where id = $${values.length}
     returning *`,
    values,
  );
  if (!result.rows[0]) throwNotFound("Offer not found.");
  await touchStation(result.rows[0].station_id);
  return result.rows[0];
}

function offerValues(payload) {
  return [
    payload.id,
    payload.stationId,
    payload.family,
    payload.standardModel,
    cleanText(payload.rawModelName),
    cleanText(payload.groupName) || "default",
    cleanText(payload.rechargeRatio),
    payload.modelMultiplier ?? null,
    payload.inputPrice ?? null,
    payload.outputPrice ?? null,
    payload.cacheReadPrice ?? null,
    payload.cacheWritePrice ?? null,
    payload.fixedPrice ?? null,
    cleanText(payload.fixedPriceUnit),
    payload.currency || "CNY",
    cleanText(payload.accountPool),
    cleanText(payload.channelType),
    cleanText(payload.priceSource),
    payload.status || "needs_review",
    payload.lastVerifiedAt ?? null,
  ];
}

async function touchStation(stationId) {
  if (!stationId) return;
  await query("update api_transit_stations set last_updated_at = now() where id = $1", [stationId]);
}

function offerId(stationId, standardModel, groupName) {
  return stableId("offer", stationId, standardModel, groupName || "default");
}

function throwNotFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  throw error;
}

async function updateSubmissionReview(id, payload) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const submissionResult = await client.query(
      "select * from api_transit_submissions where id = $1 for update",
      [id],
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      const error = new Error("Submission not found.");
      error.statusCode = 404;
      throw error;
    }

    let station = null;
    let stationCreated = false;
    let stationId = cleanText(payload.stationId) || submission.station_id || null;
    if (payload.reviewStatus === "approved") {
      const promotion = await promoteSubmissionToStation(client, submission, stationId);
      station = promotion.station;
      stationCreated = promotion.created;
      stationId = promotion.station.id;
    }

    const updated = await client.query(
      `update api_transit_submissions
       set review_status = $1,
           admin_note = $2,
           station_id = $3
       where id = $4
       returning *`,
      [payload.reviewStatus, cleanText(payload.adminNote), stationId, id],
    );

    await client.query("commit");
    return {
      submission: mapSubmission(updated.rows[0]),
      station: station ? mapStation(station) : null,
      stationCreated,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function promoteSubmissionToStation(client, submission, requestedStationId) {
  const existing = await findStationForSubmission(client, submission, requestedStationId);
  if (existing) return { station: existing, created: false };

  const websiteUrl = submission.submitted_url;
  const host = hostnameForCompare(websiteUrl);
  const id = buildStationId(submission, host);
  const name = cleanText(submission.submitted_name) || stationNameFromHost(host) || id;
  const sourceType = submission.submission_type === "merchant" ? "merchant_submitted" : "user_submitted";
  const summary = buildDraftSummary(submission);
  const adminNote = [
    `Created from submission ${submission.id}.`,
    submission.notes ? `Submitter notes: ${submission.notes}` : "",
  ].filter(Boolean).join("\n");

  const inserted = await client.query(
    `insert into api_transit_stations (
      id, slug, name, website_url, api_base_url, pricing_url, summary,
      source_type, published, data_status, usage_advice, admin_note, last_updated_at
    ) values (
      $1, $1, $2, $3, $4, $5, $6,
      $7, false, 'pending_review', 'pending', $8, now()
    )
    returning *`,
    [
      id,
      name,
      websiteUrl,
      submission.api_base_url,
      submission.pricing_url,
      summary,
      sourceType,
      adminNote,
    ],
  );
  return { station: inserted.rows[0], created: true };
}

async function findStationForSubmission(client, submission, requestedStationId) {
  if (requestedStationId) {
    const explicit = await client.query("select * from api_transit_stations where id = $1 limit 1", [requestedStationId]);
    if (explicit.rows[0]) return explicit.rows[0];
  }

  const host = hostnameForCompare(submission.submitted_url);
  if (!host) return null;
  const result = await client.query(
    `select * from api_transit_stations
     where lower(regexp_replace(website_url, '^https?://(www\\.)?', '')) like $1
     order by created_at asc
     limit 1`,
    [`${host}%`],
  );
  return result.rows[0] || null;
}

function buildStationId(submission, host) {
  const base = slugify(host || submission.submitted_name || submission.id);
  return base || stableId("station", submission.id);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeStationUrl(value) {
  const url = new URL(String(value || "").trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    const error = new Error("URL only supports http or https.");
    error.statusCode = 400;
    throw error;
  }
  url.hash = "";
  return url.toString();
}

function cleanOptionalUrl(value) {
  const text = cleanText(value);
  return text ? normalizeStationUrl(text) : null;
}

function cleanTextArray(values) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))).slice(0, 30);
}

function hostnameForCompare(value) {
  try {
    return new URL(String(value || "")).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function stationNameFromHost(host) {
  return host?.split(".").filter(Boolean)[0] || null;
}

function buildDraftSummary(submission) {
  const actor = submission.submission_type === "merchant" ? "Merchant" : "User";
  return `${actor} submitted API transit channel. Pending admin review for pricing, pool source, risk labels, and availability before publishing.`;
}

function mapSubmission(row) {
  return {
    id: row.id,
    submissionType: row.submission_type,
    submittedUrl: row.submitted_url,
    submittedName: row.submitted_name,
    apiBaseUrl: row.api_base_url,
    pricingUrl: row.pricing_url,
    contact: row.contact,
    notes: row.notes,
    submittedModels: row.submitted_models || [],
    submittedMeta: row.submitted_meta || {},
    parseStatus: row.parse_status,
    probeStatus: row.probe_status,
    reviewStatus: row.review_status,
    stationId: row.station_id,
    normalizedUrl: row.normalized_url,
    normalizedHost: row.normalized_host,
    duplicateOf: row.duplicate_of,
    duplicateCount: row.duplicate_count,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStation(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    websiteUrl: row.website_url,
    logoUrl: row.logo_url,
    apiBaseUrl: row.api_base_url,
    pricingUrl: row.pricing_url,
    monitorUrl: row.monitor_url,
    summary: row.summary,
    status: row.status,
    sourceType: row.source_type,
    commercialRelation: row.commercial_relation,
    stationSystem: row.station_system || "unknown",
    operatorType: row.operator_type || "unknown",
    invoiceSupport: row.invoice_support || "unknown",
    channelTypes: row.channel_types || [],
    accountPools: row.account_pools || [],
    paymentMethods: row.payment_methods || [],
    supportChannels: row.support_channels || [],
    riskLabels: row.risk_labels || [],
    minimumTopUp: row.minimum_top_up,
    balanceExpiry: row.balance_expiry,
    refundPolicy: row.refund_policy,
    strengths: row.strengths || [],
    cautions: row.cautions || [],
    published: row.published,
    dataStatus: row.data_status,
    usageAdvice: row.usage_advice,
    adminNote: row.admin_note,
    offerCount: Number(row.offer_count || 0),
    activeOfferCount: Number(row.active_offer_count || 0),
    pendingOfferCount: Number(row.pending_offer_count || 0),
    removedAt: row.removed_at,
    removedReason: row.removed_reason,
    lastUpdatedAt: row.last_updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOffer(row) {
  return {
    id: row.id,
    stationId: row.station_id,
    family: row.family,
    standardModel: row.standard_model,
    rawModelName: row.raw_model_name,
    groupName: row.group_name,
    rechargeRatio: row.recharge_ratio,
    modelMultiplier: numberOrNull(row.model_multiplier),
    inputPrice: numberOrNull(row.input_price),
    outputPrice: numberOrNull(row.output_price),
    cacheReadPrice: numberOrNull(row.cache_read_price),
    cacheWritePrice: numberOrNull(row.cache_write_price),
    fixedPrice: numberOrNull(row.fixed_price),
    fixedPriceUnit: row.fixed_price_unit,
    currency: row.currency,
    accountPool: row.account_pool,
    channelType: row.channel_type,
    priceSource: row.price_source,
    status: row.status,
    lastVerifiedAt: row.last_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function transitStandardModelMatchesFamily(standardModel, family) {
  const expectedFamily = TRANSIT_STANDARD_MODEL_FAMILY[standardModel];
  if (expectedFamily === family) return true;
  if (family === "image" && ["GPT Image 2", "Nano Banana Pro", "Nano Banana 2", "Nano Banana", "Nano Banana Lite"].includes(standardModel)) return true;
  if (family === "video" && ["Sora 2", "Sora 2 Pro", "Veo 3.1", "Veo 3.1 Lite", "Gemini Omni Flash", "Seedance 2.0", "Kling 2.5 Turbo"].includes(standardModel)) return true;
  return false;
}
