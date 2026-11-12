-- Ajouts sur la table events existante (rien n'est recréé, RLS et trigger conservés).
alter table public.events
  add column if not exists category_id uuid references public.categories on delete set null,
  add column if not exists color text,
  add column if not exists all_day boolean not null default false,
  add column if not exists description text,
  add column if not exists exdates timestamptz[] not null default '{}',          -- occurrences supprimées/déplacées d'une série
  add column if not exists series_id uuid references public.events on delete cascade, -- occurrence modifiée -> série d'origine
  add column if not exists original_start timestamptz;
-- Anti-doublon : une seule occurrence modifiée par date et par série
create unique index if not exists events_one_override on public.events (series_id, original_start) where series_id is not null;
-- Optionnel, la colonne n'est plus utilisée : alter table public.events drop column google_event_id;
