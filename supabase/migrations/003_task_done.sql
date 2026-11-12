-- Nouvelle table (les tables existantes ne sont pas touchées) : une ligne = une tâche cochée pour UNE journée.
-- Les journées passées ne sont jamais écrasées : cocher lundi n'affecte pas mardi.
create table if not exists public.task_done (
  id text primary key,                                  -- "<task_id>_<AAAA-MM-JJ>" : impossible à dupliquer
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  task_id uuid not null references public.tasks on delete cascade,
  day date not null, updated_at timestamptz not null default now());
alter table public.task_done enable row level security;
create policy own_rows on public.task_done for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger keep_newest before update on public.task_done for each row execute function public.keep_newest();
alter publication supabase_realtime add table public.task_done;
