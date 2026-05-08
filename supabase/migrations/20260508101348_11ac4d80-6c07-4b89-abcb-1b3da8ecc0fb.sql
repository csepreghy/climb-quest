create table if not exists public.app_theme_settings (
  id text primary key default 'global',
  selections jsonb not null default '{}'::jsonb,
  header_opacity numeric not null default 0.88,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into public.app_theme_settings (id) values ('global') on conflict (id) do nothing;

alter table public.app_theme_settings enable row level security;

drop policy if exists "anyone can read theme" on public.app_theme_settings;
create policy "anyone can read theme" on public.app_theme_settings for select using (true);

drop policy if exists "admins can update theme" on public.app_theme_settings;
create policy "admins can update theme" on public.app_theme_settings for update using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins can insert theme" on public.app_theme_settings;
create policy "admins can insert theme" on public.app_theme_settings for insert with check (public.has_role(auth.uid(), 'admin'));

alter table public.app_theme_settings replica identity full;
alter publication supabase_realtime add table public.app_theme_settings;