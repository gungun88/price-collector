import { z } from "zod";
import { query } from "../db/pool.mjs";
import {
  cleanText,
  getClientFingerprint,
  normalizeHttpUrl,
  normalizeSubmissionUrl,
  stableId,
  uniqueTextList,
} from "../utils/request.mjs";

const submissionSchema = z.object({
  type: z.enum(["user", "merchant"]).default("user"),
  url: z.string().url().max(2048),
  name: z.string().trim().max(200).optional().nullable(),
  apiBaseUrl: z.string().url().max(2048).optional().nullable(),
  pricingUrl: z.string().url().max(2048).optional().nullable(),
  contact: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  models: z.array(z.string().trim().max(80)).max(30).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  website: z.string().max(200).optional().nullable(),
});

const RATE_LIMIT_PER_HOUR = 20;

export async function registerTransitSubmissionRoutes(app) {
  app.post("/api/transit/submissions", async (request, reply) => {
    const payload = submissionSchema.parse(request.body || {});
    if (payload.website) return { ok: true, ignored: true };

    const submitterFingerprint = getClientFingerprint(request);
    await assertSubmitterRateLimit(submitterFingerprint);

    const normalized = normalizeSubmissionUrl(payload.url);
    const existing = await findExistingSubmission(normalized, submitterFingerprint);
    if (existing?.active) return { ok: true, ignored: true, id: existing.id };

    const id = stableId(
      "ats",
      payload.type,
      normalized.submittedUrl,
      submitterFingerprint,
      new Date().toISOString(),
    );

    await query(
      `insert into api_transit_submissions (
        id, submission_type, submitted_url, submitted_name, api_base_url, pricing_url,
        contact, notes, submitted_models, submitted_meta, parse_status, probe_status,
        review_status, normalized_url, normalized_host, duplicate_of, submitter_ip
      ) values (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10::jsonb, 'pending', $11,
        'pending', $12, $13, $14, $15
      )`,
      [
        id,
        payload.type,
        normalized.submittedUrl,
        cleanText(payload.name),
        cleanOptionalUrl(payload.apiBaseUrl),
        cleanOptionalUrl(payload.pricingUrl),
        cleanText(payload.contact),
        cleanText(payload.notes),
        uniqueTextList(payload.models),
        JSON.stringify(buildSubmittedMeta(payload)),
        inferProbeStatus(payload),
        normalized.normalizedUrl,
        normalized.normalizedHost,
        existing?.id || null,
        submitterFingerprint,
      ],
    );

    if (existing?.id) await incrementDuplicateCount(existing.id);
    reply.code(201);
    return { ok: true, id };
  });
}

async function assertSubmitterRateLimit(submitterFingerprint) {
  const result = await query(
    `select count(*)::int as count
     from api_transit_submissions
     where submitter_ip = $1 and created_at >= now() - interval '1 hour'`,
    [submitterFingerprint],
  );
  const count = Number(result.rows[0]?.count || 0);
  if (count >= RATE_LIMIT_PER_HOUR) {
    const error = new Error("Too many submissions. Please try again later.");
    error.statusCode = 429;
    throw error;
  }
}

async function findExistingSubmission(normalized, submitterFingerprint) {
  const activeResult = await query(
    `select id
     from api_transit_submissions
     where submitted_url = $1
       and submitter_ip = $2
       and created_at >= now() - interval '1 hour'
     order by created_at asc
     limit 1`,
    [normalized.submittedUrl, submitterFingerprint],
  );
  if (activeResult.rows[0]?.id) return { id: activeResult.rows[0].id, active: true };

  const duplicateResult = await query(
    `select id
     from api_transit_submissions
     where (normalized_url = $1 or normalized_host = $2)
       and review_status in ('pending', 'collector_todo', 'approved')
     order by created_at asc
     limit 1`,
    [normalized.normalizedUrl, normalized.normalizedHost],
  );
  if (duplicateResult.rows[0]?.id) return { id: duplicateResult.rows[0].id, active: false };
  return null;
}

async function incrementDuplicateCount(id) {
  await query(
    `update api_transit_submissions
     set duplicate_count = duplicate_count + 1
     where id = $1`,
    [id],
  );
}

function cleanOptionalUrl(value) {
  const text = cleanText(value);
  return text ? normalizeHttpUrl(text) : null;
}

function inferProbeStatus(payload) {
  const monitorUrl = typeof payload.meta?.monitorUrl === "string" ? payload.meta.monitorUrl.trim() : "";
  return payload.pricingUrl || monitorUrl ? "public_pricing_found" : "pending";
}

function buildSubmittedMeta(payload) {
  return {
    ...(payload.meta || {}),
    accessMode: "public_only",
  };
}
