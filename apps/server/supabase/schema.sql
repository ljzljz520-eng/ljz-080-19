-- ============================================================
-- 社区养老协作平台 · 活动报名功能 Supabase/PostgreSQL 建表脚本
-- ============================================================

create extension if not exists "pgcrypto";

-- 老人档案
create table if not exists elders (
  id                       text primary key,
  name                     text not null,
  gender                   text not null check (gender in ('male','female')),
  age                      int  not null check (age between 0 and 120),
  phone                    text,
  address                  text,
  emergency_contact_name   text,
  emergency_contact_phone  text,
  mobility                 text not null check (mobility in
                             ('independent','cane','walker','wheelchair','bedridden')),
  wheelchair_seat          boolean not null default false,
  dietary_restrictions     jsonb not null default '[]'::jsonb,   -- ["低糖","清真",...]
  conditions               jsonb not null default '[]'::jsonb,   -- ["糖尿病",...]
  created_at               timestamptz not null default now()
);

-- 志愿者
create table if not exists volunteers (
  id             text primary key,
  name           text not null,
  phone          text not null,
  can_drive      boolean not null default false,
  max_care_level text not null default 'independent'
                 check (max_care_level in
                   ('independent','cane','walker','wheelchair','bedridden')),
  skills         jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

-- 活动
create table if not exists activities (
  id                   text primary key,
  title                text not null,
  type                 text not null check (type in
                         ('health_lecture','haircut','festival_meal','other')),
  description          text,
  location             text not null,
  start_time           timestamptz not null,
  end_time             timestamptz not null,
  capacity             int not null check (capacity >= 0),
  wheelchair_capacity  int not null default 0 check (wheelchair_capacity >= 0),
  transport_capacity   int not null default 0 check (transport_capacity >= 0),
  status               text not null default 'published'
                       check (status in ('draft','published','ongoing','finished','cancelled')),
  created_at           timestamptz not null default now()
);
create index if not exists idx_activities_start_time on activities (start_time);

-- 活动报名（照护信息快照）
create table if not exists registrations (
  id                    text primary key,
  activity_id           text not null references activities(id) on delete cascade,
  elder_id              text not null references elders(id) on delete restrict,
  mobility              text not null check (mobility in
                          ('independent','cane','walker','wheelchair','bedridden')),
  need_wheelchair_seat  boolean not null default false,
  dietary_restrictions  jsonb not null default '[]'::jsonb,
  transport_need        jsonb not null default '{}'::jsonb,
  remark                text,
  status                text not null default 'registered'
                        check (status in ('registered','checked_in','absent','cancelled')),
  registered_at         timestamptz not null default now(),
  checked_in_at         timestamptz,
  unique (activity_id, elder_id)
);
create index if not exists idx_registrations_activity on registrations (activity_id);
create index if not exists idx_registrations_elder on registrations (elder_id);
create index if not exists idx_registrations_volunteer_filter
  on registrations (activity_id, status);

-- 照护分工
create table if not exists care_assignments (
  id              text primary key default encode(gen_random_bytes(8), 'hex'),
  activity_id     text not null references activities(id) on delete cascade,
  registration_id text not null references registrations(id) on delete cascade,
  elder_id        text not null references elders(id),
  volunteer_id    text not null references volunteers(id),
  duty            text not null check (duty in
                    ('wheelchair_assist','transport','meal_assist','companion')),
  note            text,
  unique (registration_id, volunteer_id, duty)
);
create index if not exists idx_assignments_volunteer_activity
  on care_assignments (volunteer_id, activity_id);

-- 参与记录（活动后回填）
create table if not exists participation_records (
  id               text primary key default encode(gen_random_bytes(8), 'hex'),
  activity_id      text not null references activities(id) on delete cascade,
  registration_id  text not null unique references registrations(id) on delete cascade,
  elder_id         text not null references elders(id),
  attended         boolean not null,
  health_topics    jsonb,       -- 讲座关注主题
  haircut_services jsonb,       -- 义剪项目
  meal_situation   text,        -- 聚餐用餐情况
  health_note      text,        -- 现场健康观察
  care_feedback    text,        -- 照护反馈
  satisfaction     int check (satisfaction between 1 and 5),
  filled_by        text,
  filled_at        timestamptz not null default now()
);
create index if not exists idx_records_elder on participation_records (elder_id);

-- 活动剩余名额视图：轮椅位 / 接送车位占用实时可查
create or replace view v_activity_capacity as
select a.id as activity_id,
       a.capacity,
       a.wheelchair_capacity,
       a.transport_capacity,
       count(r.*) filter (where r.status <> 'cancelled')
         as registered_count,
       count(r.*) filter (where r.need_wheelchair_seat and r.status <> 'cancelled')
         as wheelchair_used,
       count(r.*) filter (
         where (r.transport_need->>'required')::boolean and r.status <> 'cancelled')
         as transport_used
from activities a
left join registrations r on r.activity_id = a.id
group by a.id;
