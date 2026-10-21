create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  nip text not null default '',
  photo_url text not null default '',
  photo_path text not null default '',
  subject text not null,
  position text not null default '',
  education text not null default '',
  email text not null default '',
  bio text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teachers_published_name_idx
  on public.teachers(published, full_name);

drop trigger if exists teachers_set_updated_at on public.teachers;
create trigger teachers_set_updated_at before update on public.teachers
for each row execute function public.set_updated_at();

alter table public.teachers enable row level security;

drop policy if exists "Public reads published teachers" on public.teachers;
create policy "Public reads published teachers" on public.teachers
for select to anon using (published = true);

revoke insert, update, delete on public.teachers from anon, authenticated;
