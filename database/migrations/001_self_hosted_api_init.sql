create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  id text primary key,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  ip text,
  user_agent text
);

create table if not exists api_transit_submissions (
  id text primary key,
  submission_type text not null default 'user' check (submission_type in ('user', 'merchant')),
  submitted_url text not null,
  submitted_name text,
  api_base_url text,
  pricing_url text,
  contact text,
  notes text,
  submitted_models text[] not null default '{}'::text[],
  submitted_meta jsonb not null default '{}'::jsonb,
  parse_status text not null default 'pending' check (parse_status in ('pending', 'parsed', 'failed')),
  probe_status text not null default 'pending' check (probe_status in ('pending', 'public_pricing_found', 'needs_login', 'failed')),
  review_status text not null default 'pending' check (review_status in ('pending', 'collector_todo', 'approved', 'rejected')),
  station_id text,
  normalized_url text,
  normalized_host text,
  duplicate_of text references api_transit_submissions(id) on delete set null,
  duplicate_count integer not null default 0,
  admin_note text,
  submitter_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists api_transit_stations (
  id text primary key,
  slug text not null unique,
  name text not null,
  website_url text not null,
  api_base_url text,
  pricing_url text,
  monitor_url text,
  logo_url text,
  summary text not null default '',
  status text not null default 'unknown' check (status in ('unknown', 'active', 'risky', 'inactive')),
  published boolean not null default false,
  source_type text not null default 'manual',
  commercial_relation text not null default 'unknown' check (commercial_relation in ('unknown', 'none', 'partner', 'sponsor')),
  channel_types text[] not null default '{}'::text[],
  account_pools text[] not null default '{}'::text[],
  payment_methods text[] not null default '{}'::text[],
  support_channels text[] not null default '{}'::text[],
  risk_labels text[] not null default '{}'::text[],
  usage_advice text not null default 'pending' check (usage_advice in ('pending', 'trial_only', 'normal', 'avoid')),
  data_status text not null default 'pending_review' check (data_status in ('pending_review', 'verified', 'stale')),
  admin_note text,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'api_transit_submissions_station_id_fkey'
  ) then
    alter table api_transit_submissions
      add constraint api_transit_submissions_station_id_fkey
      foreign key (station_id) references api_transit_stations(id) on delete set null;
  end if;
end;
$$;

create table if not exists api_transit_offers (
  id text primary key,
  station_id text not null references api_transit_stations(id) on delete cascade,
  family text not null default 'other',
  standard_model text not null,
  raw_model_name text,
  group_name text not null default 'default',
  recharge_ratio text,
  model_multiplier numeric,
  input_price numeric,
  output_price numeric,
  cache_read_price numeric,
  cache_write_price numeric,
  fixed_price numeric,
  fixed_price_unit text,
  currency text not null default 'CNY',
  account_pool text,
  channel_type text,
  price_source text,
  status text not null default 'needs_review' check (status in ('active', 'needs_review', 'inactive')),
  last_verified_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, standard_model, group_name)
);

create table if not exists api_transit_runs (
  id text primary key,
  station_id text references api_transit_stations(id) on delete cascade,
  run_type text not null default 'manual_review' check (run_type in ('public_pricing', 'manual_review', 'probe')),
  status text not null check (status in ('success', 'partial', 'failed')),
  model_count integer not null default 0,
  offer_count integer not null default 0,
  error_message text,
  source_url text,
  raw_snapshot jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists api_transit_submissions_set_updated_at on api_transit_submissions;
create trigger api_transit_submissions_set_updated_at
before update on api_transit_submissions
for each row execute function set_updated_at();

drop trigger if exists api_transit_stations_set_updated_at on api_transit_stations;
create trigger api_transit_stations_set_updated_at
before update on api_transit_stations
for each row execute function set_updated_at();

drop trigger if exists api_transit_offers_set_updated_at on api_transit_offers;
create trigger api_transit_offers_set_updated_at
before update on api_transit_offers
for each row execute function set_updated_at();

create index if not exists admin_sessions_token_hash_idx on admin_sessions(token_hash);
create index if not exists admin_sessions_expires_at_idx on admin_sessions(expires_at);
create index if not exists api_transit_submissions_review_status_idx on api_transit_submissions(review_status, created_at desc);
create index if not exists api_transit_submissions_normalized_host_idx on api_transit_submissions(normalized_host, review_status, created_at desc);
create index if not exists api_transit_submissions_normalized_url_idx on api_transit_submissions(normalized_url, review_status, created_at desc);
create index if not exists api_transit_submissions_duplicate_of_idx on api_transit_submissions(duplicate_of);
create index if not exists api_transit_stations_published_idx on api_transit_stations(published, updated_at desc);
create index if not exists api_transit_offers_station_id_idx on api_transit_offers(station_id);
create index if not exists api_transit_offers_status_idx on api_transit_offers(status);

insert into schema_migrations (version) values ('001_self_hosted_api_init')
on conflict (version) do nothing;
