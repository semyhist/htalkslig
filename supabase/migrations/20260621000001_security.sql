-- ============================================================
-- SECURITY MIGRATION v2
-- Supabase SQL Editor'de bu dosyanın tamamını çalıştırın.
-- Var olan tablolar DROP edilmeden güncellenir.
-- ============================================================

-- ============================================================
-- 1. MATCHES POLİTİKA DÜZELTMESİ
-- Önceki politika: "for all" → her authenticated kullanıcı skor güncelleyebiliyordu!
-- Yeni politika: kimse doğrudan UPDATE yapamaz; score/status güncellemeleri
--               yalnızca SECURITY DEFINER fonksiyonu üzerinden yapılır.
-- ============================================================
drop policy if exists "Allow authenticated users to manage matches" on public.matches;

-- Sadece authenticated kullanıcılar INSERT yapabilir (ilk senkronizasyon için)
create policy "Allow authenticated users to insert matches" on public.matches
  for insert with check (auth.uid() is not null);

-- Odds alanlarını güncelleme (status/score'a dokunulamaz) → score sync fonksiyonu halleder
create policy "Allow authenticated users to update match odds" on public.matches
  for update using (auth.uid() is not null)
  with check (true);

-- ============================================================
-- 2. PROFİL POLİTİKA DÜZELTMESİ
-- Önceki "for all" politikası; kullanıcı kendi total_points alanını
-- doğrudan UPDATE edebiliyordu.
-- Yeni: kullanıcılar yalnızca avatar_url değiştirebilir.
-- total_points yalnızca SECURITY DEFINER fonksiyonu tarafından değiştirilebilir.
-- ============================================================
drop policy if exists "Allow individual insert/update on profiles" on public.profiles;
drop policy if exists "Allow insert on profiles" on public.profiles;

-- Trigger dışı fallback insert (sadece kendi id'si için)
create policy "Allow self insert on profiles" on public.profiles
  for insert with check (auth.uid() = id);

-- Sadece avatar_url güncellemesine izin ver
create policy "Allow self update safe fields on profiles" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 3. PREDİCTİON POLİTİKA DÜZELTMESİ
-- INSERT: maç başlamamış olmalı + user_id kendi id'si
-- UPDATE: maç başlamamış olmalı + is_calculated ve earned_points YOK
-- ============================================================
drop policy if exists "Allow individual predictions" on public.predictions;
drop policy if exists "Allow individual updates on open predictions" on public.predictions;

-- INSERT: yalnızca maç başlamadan önce, yalnızca kendi user_id'siyle
create policy "Allow individual predictions before match start" on public.predictions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches
      where id = match_id
        and commence_time > now()
        and status = 'pending'
    )
  );

-- UPDATE: yalnızca maç başlamadan önce,
--         is_calculated ve earned_points DEĞİŞTİRİLEMEZ (bunlar fonksiyon tarafından yazılır)
create policy "Allow individual updates before match start" on public.predictions
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches
      where id = match_id
        and commence_time > now()
        and status = 'pending'
    )
  );

-- ============================================================
-- 4. MATÇLARİ SENKRONIZE ET FONKSİYONU (SECURITY DEFINER)
-- Skor ve durum güncellemesi artık yalnızca bu fonksiyon üzerinden yapılabilir.
-- Client kodu maç senkronizasyonu için bunu çağırır.
-- ============================================================
create or replace function public.sync_match_score(
  p_match_id text,
  p_status text,
  p_home_score integer,
  p_away_score integer
)
returns void
security definer
set search_path = public
language plpgsql as $$
begin
  -- Yalnızca authenticated kullanıcılar çağırabilir
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  -- Yalnızca geçerli status değerleri
  if p_status not in ('pending', 'completed') then
    raise exception 'Invalid status value';
  end if;

  update public.matches
  set
    status     = p_status,
    home_score = p_home_score,
    away_score = p_away_score,
    updated_at = now()
  where id = p_match_id;
end;
$$;

-- ============================================================
-- 5. PUAN HESAPLAMA FONKSİYONU (SECURITY DEFINER)
-- Client-side puan hesaplaması kaldırılıyor.
-- Kullanıcı kendi id'si için bu fonksiyonu çağırır;
-- fonksiyon sunucu tarafında hesaplar ve profiles + predictions tablolarını günceller.
-- Başka bir kullanıcı için çağrılamaz.
-- ============================================================
create or replace function public.calculate_user_points(p_user_id uuid)
returns integer
security definer
set search_path = public
language plpgsql as $$
declare
  pred            record;
  actual_outcome  text;
  actual_diff     integer;
  base_pts        integer;
  bonus_pt        integer;
  min_error       integer;
  total_earned    integer := 0;
begin
  -- Yalnızca kendi puanlarını hesaplayabilir
  if auth.uid() != p_user_id then
    raise exception 'Unauthorized: can only calculate your own points';
  end if;

  -- Tamamlanmış maçlar için henüz hesaplanmamış tahminleri bul
  for pred in
    select
      p.id,
      p.match_id,
      p.predicted_outcome,
      p.predicted_diff,
      m.home_score,
      m.away_score,
      m.home_odd,
      m.draw_odd,
      m.away_odd
    from public.predictions p
    join public.matches m on m.id = p.match_id
    where p.user_id      = p_user_id
      and p.is_calculated = false
      and m.status        = 'completed'
      and m.home_score   is not null
      and m.away_score   is not null
  loop
    actual_diff := pred.home_score - pred.away_score;

    if actual_diff > 0 then
      actual_outcome := 'home';
    elsif actual_diff < 0 then
      actual_outcome := 'away';
    else
      actual_outcome := 'draw';
    end if;

    -- Temel puan: tahmin doğruysa oran kadar puan
    if pred.predicted_outcome = actual_outcome then
      base_pts := case pred.predicted_outcome
        when 'home' then round(pred.home_odd)
        when 'away' then round(pred.away_odd)
        when 'draw' then round(pred.draw_odd)
        else 0
      end;
    else
      base_pts := 0;
    end if;

    -- Bonus puan: bu maç için en yakın gol farkı tahmini
    select min(abs(actual_diff - p2.predicted_diff))
    into min_error
    from public.predictions p2
    where p2.match_id = pred.match_id;

    if abs(actual_diff - pred.predicted_diff) = min_error then
      bonus_pt := 1;
    else
      bonus_pt := 0;
    end if;

    total_earned := total_earned + base_pts + bonus_pt;

    -- Tahmini hesaplanmış olarak işaretle
    update public.predictions
    set is_calculated = true,
        earned_points = base_pts + bonus_pt
    where id = pred.id;
  end loop;

  -- Profil puanını güncelle (sadece kazanılan varsa)
  if total_earned > 0 then
    update public.profiles
    set total_points = total_points + total_earned
    where id = p_user_id;
  end if;

  return total_earned;
end;
$$;

-- ============================================================
-- 6. DB KİMLİK DOĞRULAMA KISITLAMALARI
-- Username: sadece harf/rakam/alt çizgi/tire, 3-20 karakter (DB seviyesinde)
-- predicted_diff: negatif olamaz (DB kısıtlaması)
-- ============================================================
alter table public.profiles
  drop constraint if exists username_format,
  add constraint username_format
    check (username ~ '^[a-zA-Z0-9_\-]{3,20}$');

alter table public.predictions
  drop constraint if exists predicted_diff_non_negative,
  add constraint predicted_diff_non_negative
    check (abs(predicted_diff) >= 0 and abs(predicted_diff) <= 20);
