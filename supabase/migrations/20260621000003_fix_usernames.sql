-- ============================================================
-- USERNAME FIX FUNCTIONS
-- Functions to handle username display with email fallback
-- ============================================================

-- Function to get leaderboard with proper usernames (extracted from email if needed)
create or replace function public.get_leaderboard_with_usernames()
returns table (
  id uuid,
  username text,
  total_points integer
)
security definer
set search_path = public
language sql as $$
  select
    p.id,
    case
      when p.username like 'user_%' then coalesce(
        au.raw_user_meta_data->>'username',
        split_part(au.email, '@', 1),
        p.username
      )
      else p.username
    end as username,
    p.total_points
  from public.profiles p
  left join auth.users au on p.id = au.id
  order by p.total_points desc;
$$;
