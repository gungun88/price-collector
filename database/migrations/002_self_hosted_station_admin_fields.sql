alter table api_transit_stations
  add column if not exists station_system text not null default 'unknown' check (station_system in ('new_api', 'sub_to_api', 'custom', 'unknown')),
  add column if not exists operator_type text not null default 'unknown' check (operator_type in ('company', 'individual', 'unknown')),
  add column if not exists invoice_support text not null default 'unknown' check (invoice_support in ('supported', 'unsupported', 'unknown')),
  add column if not exists minimum_top_up text,
  add column if not exists balance_expiry text,
  add column if not exists refund_policy text,
  add column if not exists strengths text[] not null default '{}'::text[],
  add column if not exists cautions text[] not null default '{}'::text[],
  add column if not exists removed_at timestamptz,
  add column if not exists removed_reason text;

insert into schema_migrations (version) values ('002_self_hosted_station_admin_fields')
on conflict (version) do nothing;
