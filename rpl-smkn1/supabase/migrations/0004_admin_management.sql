alter table public.admins
  add column if not exists full_name text not null default '',
  add column if not exists role text not null default 'admin';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.admins'::regclass
      and conname = 'admins_role_check'
  ) then
    alter table public.admins
      add constraint admins_role_check check (role in ('admin', 'superadmin'));
  end if;
end;
$$;

update public.admins
set role = 'superadmin'
where id = (
  select id
  from public.admins
  where enabled = true
  order by created_at asc, id asc
  limit 1
)
and not exists (
  select 1 from public.admins where role = 'superadmin' and enabled = true
);

create or replace function public.update_admin_account(
  p_admin_id uuid,
  p_full_name text,
  p_email text,
  p_username text,
  p_role text,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_admin public.admins%rowtype;
  active_superadmins integer;
begin
  if p_role not in ('admin', 'superadmin') then
    raise exception 'Invalid admin role.';
  end if;

  lock table public.admins in share row exclusive mode;

  select * into current_admin
  from public.admins
  where id = p_admin_id
  for update;

  if not found then
    raise exception 'Admin account not found.';
  end if;

  if current_admin.enabled and current_admin.role = 'superadmin'
      and (not p_enabled or p_role <> 'superadmin') then
    select count(*) into active_superadmins
    from public.admins
    where enabled = true and role = 'superadmin';
    if active_superadmins <= 1 then
      raise exception 'At least one active superadmin must remain.';
    end if;
  end if;

  update public.admins
  set full_name = p_full_name,
      email = p_email,
      username = p_username,
      role = p_role,
      enabled = p_enabled
  where id = p_admin_id;
end;
$$;

revoke all on function public.update_admin_account(uuid, text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.update_admin_account(uuid, text, text, text, text, boolean)
  to service_role;
