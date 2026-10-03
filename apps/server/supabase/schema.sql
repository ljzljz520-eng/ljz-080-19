-- 社区养老协作平台 · 活动报名功能建表脚本（Supabase Postgres）

create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  care_elder_ids uuid[] not null default '{}'
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text not null check (gender in ('male','female')),
  age int not null,
  phone text not null,
  address text not null default '',
  mobility text not null check (mobility in ('independent','slow','walker','wheelchair')),
  dietary_restrictions jsonb not null default '[]',
  health_note text,
  emergency_contact jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('health_talk','haircut','dinner','other')),
  description text not null default '',
  location text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  capacity int not null check (capacity >= 0),
  wheelchair_spots int not null default 0,
  has_meal boolean not null default false,
  transport_provided boolean not null default false,
  volunteer_ids uuid[] not null default '{}',
  status text not null default 'open' check (status in ('open','ongoing','finished')),
  created_at timestamptz not null default now()
);

-- 报名记录（含照护信息登记）
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id),
  participant_id uuid not null references participants(id),
  mobility text not null check (mobility in ('independent','slow','walker','wheelchair')),
  wheelchair_seat boolean not null default false,
  dietary_restrictions jsonb not null default '[]',
  transport_need text not null default 'none' check (transport_need in ('none','pickup','round_trip')),
  transport_address text,
  care_note text,
  emergency_contact jsonb not null,
  status text not null default 'registered'
    check (status in ('registered','checked_in','cancelled','no_show')),
  assigned_volunteer_id uuid references volunteers(id),
  check_in_code text not null,
  registered_at timestamptz not null default now(),
  checked_in_at timestamptz,
  unique (activity_id, participant_id)
);
create index if not exists idx_registrations_activity on registrations(activity_id);
create index if not exists idx_registrations_volunteer on registrations(assigned_volunteer_id);

-- 活动结束后回填的参与记录
create table if not exists participation_records (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id),
  participant_id uuid not null references participants(id),
  registration_id uuid not null unique references registrations(id),
  attended boolean not null,
  used_wheelchair_seat boolean not null default false,
  used_transport boolean not null default false,
  meal_note text,
  care_summary text,
  tags jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists idx_records_participant on participation_records(participant_id);
