-- ============================================================
-- HOTFIX: Profil INSERT/upsert politikasını düzelt
-- 406 PGRST116 hatasını çözer.
-- Supabase SQL Editor'de çalıştırın.
-- ============================================================

-- Eski kısıtlayıcı politikayı kaldır
drop policy if exists "Allow self insert on profiles" on public.profiles;

-- Yeni: authenticated kullanıcı kendi id'si için insert/upsert yapabilir.
-- (Trigger da bu sayede çalışmaya devam eder)
create policy "Allow self insert on profiles" on public.profiles
  for insert with check (
    auth.uid() = id
    or auth.role() = 'service_role'
  );

-- total_points doğrudan güncellenemez garantisi için:
-- Authenticated UPDATE politikası mevcut (sadece avatar_url gibi alanlar)
-- total_points yalnızca calculate_user_points() SECURITY DEFINER fonksiyonu günceller.
-- Bu politika zaten güvenlik migration'ında var, burada yeniden oluşturmaya gerek yok.
