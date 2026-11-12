create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, color text default '#1E6FD9', updated_at timestamptz not null default now());
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null, done boolean not null default false,
  priority smallint not null default 2 check (priority between 1 and 3),
  category_id uuid references public.categories on delete set null,
  due_at timestamptz, recurrence text,            -- RRULE, ex. FREQ=WEEKLY;BYDAY=MO
  completed_at timestamptz, updated_at timestamptz not null default now());
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null, starts_at timestamptz not null, ends_at timestamptz,
  recurrence text, google_event_id text, updated_at timestamptz not null default now());
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null default '{}', updated_at timestamptz not null default now());

-- Conflits : last-write-wins par updated_at (une modif plus ancienne est ignorée)
create function public.keep_newest() returns trigger language plpgsql as $$
begin if new.updated_at < old.updated_at then return old; end if; return new; end $$;
do $$ declare t text; begin
 foreach t in array array['categories','tasks','events','settings'] loop
  execute format('create trigger keep_newest before update on public.%I for each row execute function public.keep_newest()', t);
  execute format('alter table public.%I enable row level security', t);
  execute format('create policy own_rows on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  execute format('alter publication supabase_realtime add table public.%I', t);
 end loop; end $$;

-- Statistiques synchronisées (calculées côté serveur, protégées par RLS)
create view public.stats with (security_invoker = true) as
 select user_id, count(*) filter (where done) as done_count, count(*) as total,
        count(*) filter (where done and completed_at::date = current_date) as done_today
 from public.tasks group by user_id;
