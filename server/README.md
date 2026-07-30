# PriceAI Self-Hosted API

This is the self-hosted backend service for PriceAI transit data. It is intentionally small: health check, public transit submissions, and a password-protected admin API for submissions, stations, and offers backed by PostgreSQL.

## Local Docker Smoke

Start PostgreSQL and the API:

```bash
docker compose -f docker-compose.selfhost.yml up -d --build
```

Apply the initial database migration from the host:

```bash
cd server
DATABASE_URL=postgres://priceai:priceai_dev_password@localhost:15432/priceai node scripts/migrate.mjs
```

Check health:

```bash
curl http://localhost:4100/health
```

Run the admin smoke check:

```bash
cd server
npm run smoke:admin
```

Submit a transit channel:

```bash
curl -X POST http://localhost:4100/api/transit/submissions \
  -H "content-type: application/json" \
  -d '{"url":"https://example.com/","name":"Demo Transit"}'
```

Inspect rows:

```bash
docker exec priceai-postgres psql -U priceai -d priceai \
  -c "select id, submitted_url, review_status from api_transit_submissions order by created_at desc limit 5;"
```

Login as admin and list pending submissions manually. The development password is `priceai_admin_dev_password`:

```powershell
$body = @{ password = 'priceai_admin_dev_password' } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:4100/api/admin/login -Method Post -ContentType 'application/json' -Body $body -SessionVariable admin
Invoke-WebRequest -Uri http://localhost:4100/api/admin/session -WebSession $admin
Invoke-WebRequest -Uri http://localhost:4100/api/admin/transit/submissions -WebSession $admin
```

Approve a submission and create a draft station:

```powershell
$body = @{ reviewStatus = 'approved'; adminNote = 'local review' } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:4100/api/admin/transit/submissions/<submission-id> -Method Patch -ContentType 'application/json' -Body $body -WebSession $admin
```

Stop containers while keeping data:

```bash
docker compose -f docker-compose.selfhost.yml down
```

## Current Scope

- `GET /health`
- `POST /api/transit/submissions`
- `GET /api/transit/stations`
- `GET /api/transit/stations/:slug`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `GET /api/admin/transit/submissions`
- `PATCH /api/admin/transit/submissions/:id`
- `GET /api/admin/transit/stations`
- `POST /api/admin/transit/stations`
- `PATCH /api/admin/transit/stations/:id`
- `DELETE /api/admin/transit/stations/:id`
- `POST /api/admin/transit/stations/:id/restore`
- `GET /api/admin/transit/offers`
- `POST /api/admin/transit/offers`
- `PATCH /api/admin/transit/offers/:id`
- PostgreSQL migrations `database/migrations/001_self_hosted_api_init.sql` and `database/migrations/002_self_hosted_station_admin_fields.sql`

## Frontend Integration

The Next.js app can forward public transit channel submissions to this API. Configure the frontend process with:

```bash
SELF_HOSTED_API_BASE_URL=http://localhost:4100
PRICEAI_FORWARD_SECRET=change-this-forward-secret
```

The existing frontend endpoint `/api/api-transit-submissions` keeps its public contract and forwards normal public submissions to `POST /api/transit/submissions`. Merchant submissions that include test keys or test accounts still use the legacy credential path until encrypted credential storage is migrated.

The public site reads transit stations from the self-hosted API first. If that service is unavailable, the app can still fall back to the legacy read path.

## Production Notes

Before deploying to a VPS, set real values for `POSTGRES_PASSWORD`, `APP_SECRET`, `PRICEAI_FORWARD_SECRET`, `ADMIN_PASSWORD_HASH_B64`, `COOKIE_SECURE`, and `CORS_ORIGINS`. Generate the admin password hash with:

```bash
node scripts/hash-password.mjs your-strong-admin-password
```

If you use Docker Compose, prefer putting the generated base64url value into `ADMIN_PASSWORD_HASH_B64` so `$` characters in the raw hash are not interpreted by Compose.
