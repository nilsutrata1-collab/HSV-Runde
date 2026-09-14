-- HSV-Runde: Supabase-Datenmodell
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (group_id,user_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  opponent text not null,
  date timestamptz not null,
  venue text not null default 'Volksparkstadion, Hamburg',
  created_at timestamptz not null default now()
);

create table if not exists public.responses (
  match_id uuid references public.matches(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  status text not null check (status in ('dabei','vielleicht','nicht')),
  private_reason text not null default '',
  updated_at timestamptz not null default now(),
  primary key (match_id,user_id)
);

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date timestamptz not null,
  private_note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.matches enable row level security;
alter table public.responses enable row level security;
alter table public.commitments enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "groups readable for members" on public.groups for select using (
  exists (select 1 from public.group_members gm where gm.group_id=id and gm.user_id=auth.uid())
);
create policy "users create groups" on public.groups for insert with check (auth.uid()=created_by);

create policy "members readable" on public.group_members for select using (
  exists (select 1 from public.group_members x where x.group_id=group_id and x.user_id=auth.uid())
);
create policy "users join groups" on public.group_members for insert with check (auth.uid()=user_id);

create policy "matches readable" on public.matches for select using (true);

create policy "responses readable to signed-in users" on public.responses for select using (auth.role()='authenticated');
create policy "own response insert" on public.responses for insert with check (auth.uid()=user_id);
create policy "own response update" on public.responses for update using (auth.uid()=user_id);
create policy "own response delete" on public.responses for delete using (auth.uid()=user_id);

create policy "own commitments" on public.commitments for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- Beispielspiele; später durch einen Spielplan-Import/API ersetzen.
insert into public.matches (opponent,date,venue)
select 'FC St. Pauli','2027-03-14T15:30:00+01:00','Volksparkstadion, Hamburg'
where not exists (select 1 from public.matches where opponent='FC St. Pauli');
