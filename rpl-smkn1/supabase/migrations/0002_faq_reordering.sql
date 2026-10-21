create or replace function public.reorder_faq(p_item_id uuid, p_neighbor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item_position integer;
  neighbor_position integer;
begin
  if p_item_id = p_neighbor_id then
    raise exception 'FAQ items must be different.';
  end if;

  lock table public.faq in share row exclusive mode;

  with positions as (
    select
      id,
      row_number() over (order by sort_order asc, created_at asc, id asc)::integer as position
    from public.faq
  )
  select
    max(position) filter (where id = p_item_id),
    max(position) filter (where id = p_neighbor_id)
  into item_position, neighbor_position
  from positions;

  if item_position is null or neighbor_position is null then
    raise exception 'FAQ item not found.';
  end if;

  with positions as (
    select
      id,
      row_number() over (order by sort_order asc, created_at asc, id asc)::integer as position
    from public.faq
  )
  update public.faq as target
  set sort_order = case
    when target.id = p_item_id then neighbor_position
    when target.id = p_neighbor_id then item_position
    else positions.position
  end
  from positions
  where target.id = positions.id;
end;
$$;

revoke all on function public.reorder_faq(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reorder_faq(uuid, uuid) to service_role;
