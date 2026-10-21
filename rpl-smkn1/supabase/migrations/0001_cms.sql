create extension if not exists pgcrypto;

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text not null unique,
  password_hash text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_sessions_expiry_idx on public.admin_sessions(expires_at);

create table if not exists public.admin_login_attempts (
  email_hash text not null,
  ip_hash text not null,
  failures integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (email_hash, ip_hash)
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null,
  image_url text not null,
  image_path text not null,
  alt_text text not null,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  content text not null,
  category text not null,
  author text not null,
  cover_url text not null default '',
  cover_path text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists articles_published_at_idx on public.articles(published, published_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admins_set_updated_at on public.admins;
create trigger admins_set_updated_at before update on public.admins
for each row execute function public.set_updated_at();
drop trigger if exists gallery_set_updated_at on public.gallery;
create trigger gallery_set_updated_at before update on public.gallery
for each row execute function public.set_updated_at();
drop trigger if exists faq_set_updated_at on public.faq;
create trigger faq_set_updated_at before update on public.faq
for each row execute function public.set_updated_at();
drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles
for each row execute function public.set_updated_at();

alter table public.admins enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_login_attempts enable row level security;
alter table public.gallery enable row level security;
alter table public.faq enable row level security;
alter table public.articles enable row level security;

drop policy if exists "Public reads published gallery" on public.gallery;
create policy "Public reads published gallery" on public.gallery
for select to anon using (published = true);
drop policy if exists "Public reads published faq" on public.faq;
create policy "Public reads published faq" on public.faq
for select to anon using (published = true);
drop policy if exists "Public reads published articles" on public.articles;
create policy "Public reads published articles" on public.articles
for select to anon using (published = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rpl-cms', 'rpl-cms', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads CMS images" on storage.objects;
create policy "Public reads CMS images" on storage.objects
for select to anon using (bucket_id = 'rpl-cms');

revoke all on public.admins, public.admin_sessions, public.admin_login_attempts from anon, authenticated;
revoke insert, update, delete on public.gallery, public.faq, public.articles from anon, authenticated;
