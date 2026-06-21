-- ============================================================
-- HOTFIX: Mevcut "user_..." Kullanıcı Adlarını Toplu Düzelt
-- Supabase SQL Editor'de çalıştırın.
-- ============================================================

-- 1. Profiles tablosundaki jenerik "user_..." kullanıcı adlarını topluca düzelt.
-- auth.users tablosundaki metadata'daki username veya email başını kullanır.
update public.profiles p
set username = regexp_replace(
  coalesce(
    nullif(au.raw_user_meta_data->>'username', ''),
    nullif(split_part(au.email, '@', 1), '')
  ),
  '[^a-zA-Z0-9_\-]', '', 'g' -- DB kısıtlamasına uyması için regex dışındaki karakterleri temizle
)
from auth.users au
where p.id = au.id
  and p.username like 'user_%'
  and coalesce(
    nullif(au.raw_user_meta_data->>'username', ''),
    nullif(split_part(au.email, '@', 1), '')
  ) is not null
  -- Yeni kullanıcı adının en az 3 karakter olduğundan emin ol (kısıtlama ihlali yapmamak için)
  and length(
    regexp_replace(
      coalesce(
        nullif(au.raw_user_meta_data->>'username', ''),
        nullif(split_part(au.email, '@', 1), '')
      ),
      '[^a-zA-Z0-9_\-]', '', 'g'
    )
  ) >= 3;

-- 2. get_leaderboard_with_usernames fonksiyonunu da daha dayanıklı hale getirelim.
-- Eğer profil tablosunda bir şekilde hâlâ jenerik ad kalmışsa bile, leaderboard'da gerçek adı gösterir.
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
      -- Kullanıcı adı jenerik ise auth.users'taki gerçek veriyi fallback yap
      when p.username like 'user_%' then regexp_replace(
        coalesce(
          nullif(au.raw_user_meta_data->>'username', ''),
          nullif(split_part(au.email, '@', 1), ''),
          p.username
        ),
        '[^a-zA-Z0-9_\-]', '', 'g'
      )
      else p.username
    end as username,
    p.total_points
  from public.profiles p
  left join auth.users au on p.id = au.id
  order by p.total_points desc;
$$;
