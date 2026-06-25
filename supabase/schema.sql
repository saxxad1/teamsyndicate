create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('admin', 'member');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  group_name text not null default 'Team Syndicate',
  currency text not null default 'BDT',
  first_month_contribution numeric(14, 2) not null default 5000,
  monthly_contribution numeric(14, 2) not null default 2000,
  fund_start_month int not null check (fund_start_month between 1 and 12),
  fund_start_year int not null check (fund_start_year >= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  member_code text unique,
  name text not null,
  designation text,
  phone text not null,
  email text not null unique,
  nid text,
  blood_group text,
  address text,
  emergency_contact_phone text,
  emergency_contact_name text,
  opening_balance numeric(14, 2) not null default 0 check (opening_balance >= 0),
  profile_image_url text,
  join_date date not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

alter table public.members add column if not exists member_code text unique;
alter table public.members add column if not exists designation text;
alter table public.members add column if not exists nid text;
alter table public.members add column if not exists blood_group text;
alter table public.members add column if not exists address text;
alter table public.members add column if not exists emergency_contact_phone text;
alter table public.members add column if not exists emergency_contact_name text;
alter table public.members add column if not exists opening_balance numeric(14, 2) not null default 0 check (opening_balance >= 0);
alter table public.members add column if not exists profile_image_url text;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.user_role not null default 'member',
  member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null check (year >= 2000),
  amount numeric(14, 2) not null check (amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  status text not null default 'unpaid' check (status in ('paid', 'unpaid', 'partial')),
  paid_date date,
  payment_method text check (payment_method in ('Cash', 'bKash', 'Nagad', 'Bank', 'Other')),
  note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (member_id, month, year)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  investment_amount numeric(14, 2) not null default 0 check (investment_amount >= 0),
  expected_return numeric(14, 2) not null default 0 check (expected_return >= 0),
  actual_return numeric(14, 2) not null default 0 check (actual_return >= 0),
  expense numeric(14, 2) not null default 0 check (expense >= 0),
  profit numeric(14, 2) not null default 0 check (profit >= 0),
  loss numeric(14, 2) not null default 0 check (loss >= 0),
  status text not null default 'running' check (status in ('running', 'closed')),
  start_date date not null,
  end_date date,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (
    type in (
      'Member Contribution',
      'Investment',
      'Project Expense',
      'Project Return',
      'Profit',
      'Loss',
      'Other Income',
      'Other Expense'
    )
  ),
  amount numeric(14, 2) not null check (amount >= 0),
  date date not null,
  member_id uuid references public.members(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  contribution_id uuid references public.contributions(id) on delete set null,
  payment_method text check (payment_method in ('Cash', 'bKash', 'Nagad', 'Bank', 'Other')),
  note text,
  created_by uuid references public.users(id) on delete set null,
  source text not null default 'manual' check (source in ('auto', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists contributions_period_idx on public.contributions (year, month);
create index if not exists contributions_member_idx on public.contributions (member_id);
create index if not exists members_member_code_idx on public.members (member_code);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists transactions_date_idx on public.transactions (date);
create index if not exists transactions_member_idx on public.transactions (member_id);
create index if not exists transactions_project_idx on public.transactions (project_id);

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_id = auth.uid()
$$;

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select member_id from public.users where auth_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where auth_id = auth.uid()
      and role = 'admin'
  )
$$;

alter table public.settings enable row level security;
alter table public.users enable row level security;
alter table public.members enable row level security;
alter table public.contributions enable row level security;
alter table public.projects enable row level security;
alter table public.transactions enable row level security;

drop policy if exists settings_select_authenticated on public.settings;
create policy settings_select_authenticated
on public.settings
for select
to authenticated
using (true);

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write
on public.settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists users_select_own_or_admin on public.users;
create policy users_select_own_or_admin
on public.users
for select
to authenticated
using (public.is_admin() or auth_id = auth.uid());

drop policy if exists users_admin_write on public.users;
create policy users_admin_write
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists members_select_own_or_admin on public.members;
drop policy if exists members_select_authenticated on public.members;
create policy members_select_authenticated
on public.members
for select
to authenticated
using (true);

drop policy if exists members_admin_write on public.members;
create policy members_admin_write
on public.members
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists members_member_update_own on public.members;
create policy members_member_update_own
on public.members
for update
to authenticated
using (id = public.current_member_id())
with check (id = public.current_member_id());

create or replace function public.prevent_member_protected_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if old.id = public.current_member_id() then
    if
      new.member_code is distinct from old.member_code
      or new.designation is distinct from old.designation
      or new.email is distinct from old.email
      or new.opening_balance is distinct from old.opening_balance
      or new.profile_image_url is distinct from old.profile_image_url
      or new.join_date is distinct from old.join_date
      or new.status is distinct from old.status
    then
      raise exception 'Members can only update personal profile fields';
    end if;

    return new;
  end if;

  raise exception 'Not allowed';
end;
$$;

drop trigger if exists prevent_member_protected_profile_update on public.members;
create trigger prevent_member_protected_profile_update
before update on public.members
for each row
execute function public.prevent_member_protected_profile_update();

drop policy if exists contributions_select_own_or_admin on public.contributions;
drop policy if exists contributions_select_authenticated on public.contributions;
create policy contributions_select_authenticated
on public.contributions
for select
to authenticated
using (true);

drop policy if exists contributions_admin_write on public.contributions;
create policy contributions_admin_write
on public.contributions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists projects_select_authenticated on public.projects;
create policy projects_select_authenticated
on public.projects
for select
to authenticated
using (true);

drop policy if exists projects_admin_write on public.projects;
create policy projects_admin_write
on public.projects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists transactions_select_own_or_admin on public.transactions;
drop policy if exists transactions_select_authenticated on public.transactions;
create policy transactions_select_authenticated
on public.transactions
for select
to authenticated
using (true);

drop policy if exists transactions_admin_write on public.transactions;
create policy transactions_admin_write
on public.transactions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.settings (
  group_name,
  currency,
  first_month_contribution,
  monthly_contribution,
  fund_start_month,
  fund_start_year
)
select 'Team Syndicate', 'BDT', 5000, 2000, 5, 2026
where not exists (select 1 from public.settings);

insert into storage.buckets (id, name, public)
values ('member-profile-images', 'member-profile-images', true)
on conflict (id) do update
set public = true;

drop policy if exists member_profile_images_select on storage.objects;
create policy member_profile_images_select
on storage.objects
for select
to authenticated
using (bucket_id = 'member-profile-images');

drop policy if exists member_profile_images_admin_insert on storage.objects;
create policy member_profile_images_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'member-profile-images'
  and public.is_admin()
);

drop policy if exists member_profile_images_admin_update on storage.objects;
create policy member_profile_images_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'member-profile-images'
  and public.is_admin()
)
with check (
  bucket_id = 'member-profile-images'
  and public.is_admin()
);

drop policy if exists member_profile_images_admin_delete on storage.objects;
create policy member_profile_images_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'member-profile-images'
  and public.is_admin()
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null,
  vote_count int not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.poll_voters (
  poll_id uuid not null references public.polls(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, member_id)
);

create or replace function public.cast_vote(p_poll_id uuid, p_option_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  v_member_id := public.current_member_id();
  if v_member_id is null then
    raise exception 'Not authorized';
  end if;

  if exists (
    select 1 from public.poll_voters
    where poll_id = p_poll_id and member_id = v_member_id
  ) then
    raise exception 'Already voted';
  end if;

  if not exists (
    select 1 from public.polls
    where id = p_poll_id and status = 'open'
  ) then
    raise exception 'Poll is not open';
  end if;

  insert into public.poll_voters (poll_id, member_id)
  values (p_poll_id, v_member_id);

  update public.poll_options
  set vote_count = vote_count + 1
  where id = p_option_id and poll_id = p_poll_id;
end;
$$;

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_voters enable row level security;

drop policy if exists polls_select_authenticated on public.polls;
create policy polls_select_authenticated on public.polls for select to authenticated using (true);

drop policy if exists polls_admin_write on public.polls;
create policy polls_admin_write on public.polls for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists poll_options_select_authenticated on public.poll_options;
create policy poll_options_select_authenticated on public.poll_options for select to authenticated using (true);

drop policy if exists poll_options_admin_write on public.poll_options;
create policy poll_options_admin_write on public.poll_options for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists poll_voters_select_authenticated on public.poll_voters;
create policy poll_voters_select_authenticated on public.poll_voters for select to authenticated using (true);
alter table public.polls add column if not exists deadline timestamptz;
