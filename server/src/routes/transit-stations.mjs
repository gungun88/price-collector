import { z } from "zod";
import { query } from "../db/pool.mjs";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(300).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function registerTransitStationRoutes(app) {
  app.get("/api/transit/stations", async (request) => {
    const params = listQuerySchema.parse(request.query || {});
    const result = await query(
      `select s.*,
        coalesce(
          json_agg(o.* order by coalesce(o.last_verified_at, o.updated_at, o.created_at) desc)
            filter (where o.id is not null),
          '[]'::json
        ) as offers
       from api_transit_stations s
       left join api_transit_offers o
         on o.station_id = s.id
        and o.status = 'active'
       where s.published = true
         and s.removed_at is null
       group by s.id
       order by coalesce(s.last_updated_at, s.updated_at, s.created_at) desc
       limit $1 offset $2`,
      [params.limit, params.offset],
    );
    return { ok: true, stations: result.rows.map(mapPublicStation) };
  });

  app.get("/api/transit/stations/:slug", async (request) => {
    const slug = String(request.params.slug || "").trim();
    if (!slug) {
      const error = new Error("Station slug is required.");
      error.statusCode = 400;
      throw error;
    }

    const result = await query(
      `select s.*,
        coalesce(
          json_agg(o.* order by coalesce(o.last_verified_at, o.updated_at, o.created_at) desc)
            filter (where o.id is not null),
          '[]'::json
        ) as offers
       from api_transit_stations s
       left join api_transit_offers o
         on o.station_id = s.id
        and o.status = 'active'
       where s.published = true
         and s.removed_at is null
         and (s.slug = $1 or s.id = $1)
       group by s.id
       limit 1`,
      [slug],
    );

    const station = result.rows[0];
    if (!station) {
      return { ok: true, station: null };
    }
    return { ok: true, station: mapPublicStation(station) };
  });
}

function mapPublicStation(row) {
  const offers = Array.isArray(row.offers) ? row.offers : [];
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
    usageAdvice: row.usage_advice,
    dataStatus: row.data_status,
    lastUpdatedAt: row.last_updated_at || row.updated_at || row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    offers: offers.map(mapPublicOffer),
  };
}

function mapPublicOffer(row) {
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
    currency: row.currency || "CNY",
    accountPool: row.account_pool,
    channelType: row.channel_type,
    priceSource: row.price_source,
    status: row.status,
    lastVerifiedAt: row.last_verified_at,
    rawPayload: row.raw_payload || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
