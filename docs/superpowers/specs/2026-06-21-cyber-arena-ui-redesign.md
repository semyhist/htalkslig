# HTalks Dünya Kupası Ligi - Cyber-Arena Arayüz Tasarımı ve Kimlik Doğrulama Güncellemesi

Bu belge, "HTalks Dünya Kupası Ligi" platformunun kullanıcı arayüzünü tamamen profesyonel, espor temalı bir "Cyber-Arena" tasarımına dönüştürme ve giriş/kayıt akışını e-postasız kullanıcı adı/şifre tabanlı yapıya geçirme planını açıklamaktadır.

---

## 1. Tasarım Sistemi: Cyber-Arena Konsepti

Mevcut sade görünüm, modern bir oyun/turnuva dashboard'una dönüştürülecektir. 

### 1.1. Renkler ve Görsel Dil
*   **Arka Plan:** Derin obsidyen siyahı (`#030014`) ile tepe kısmından yayılan hafif mor radyal ışık efekti (`radial-gradient`).
*   **Paneller (Glassmorphism):** Düşük opaklıklı koyu cam paneller (`rgba(12, 10, 24, 0.7)`) ve yoğun bulanıklık (`backdrop-blur-xl`).
*   **Vurgu Renkleri:** Neon Violet (`#8b5cf6`), Neon Cyan (`#06b6d4`), Altın Sarı (`#fbbf24`).
*   **Kenarlıklar:** İnce yarı şeffaf sınırlar (`border-white/5`), aktif kartlarda veya hover durumunda mor neon parıltı (`shadow-glow` ile `rgba(139, 92, 246, 0.4)`).
*   **İkonlar:** Emojiler tamamen kaldırılacak. Yerlerine Lucide React ikon kütüphanesinden modern ve temiz çizgi ikonlar (`Trophy`, `Sparkles`, `Clock`, `User`, `Info`, `Lock`, `Gamepad2` vb.) eklenecektir.

### 1.2. Grid Düzeni ve Layout
Sayfa, 12 kolonluk esnek ve dengeli bir ızgara düzenine (desktop) oturtulacaktır:
*   **Sol Sütun (3 Kolon):** 
    *   **Kullanıcı Kartı:** Aktif kullanıcının istatistiklerini (Puan, Doğru Tahmin Sayısı, Lig Sırası) gösteren neon detaylı küçük bir profil kartı.
    *   **Kurallar & Bilgi Kartı:** Puanlama kurallarının Lucide ikonlarıyla listelendiki minimalist bir panel.
*   **Orta Sütun (6 Kolon):**
    *   Tahmin Kartları listesi. Geniş, okunaklı, ülke bayraklarını SVG formatında veya yuvarlak bayrak logolarıyla gösteren, oran butonları neon parıltılı modern kart tasarımları.
*   **Sağ Sütun (3 Kolon):**
    *   **Liderlik Tablosu:** İlk 3 sıradaki kullanıcıları altın, gümüş ve bronz neon kenarlıklarla vurgulayan, sıralama numarasını temiz bir monospace font ile yazan turnuva sıralama listesi.

---

## 2. Kimlik Doğrulama: Kullanıcı Adı & Şifre ve "Beni Hatırla"

Supabase Auth varsayılan olarak e-posta veya telefon gerektirir. Kullanıcılardan e-posta istememek için şu çözüm uygulanacaktır:

### 2.1. E-postasız Giriş/Kayıt Çözümü
*   **Kayıt (Sign Up):** Kullanıcı `kullanici_adi` ve `sifre` girer. Arka planda `kullanici_adi@htalkswc.local` şeklinde sanal bir e-posta adresi oluşturulur.
*   **Oturum Açma (Login):** Kullanıcı kullanıcı adı girdiğinde, arka planda e-posta yine `username@htalkswc.local` formatına çevrilerek Supabase Auth'a iletilir.
*   **Benzersizlik Kontrolü:** Kaydolurken, `profiles` tablosunda bu kullanıcı adının daha önce alınıp alınmadığı sorgulanır. Alınmışsa kullanıcıya "Bu kullanıcı adı zaten alınmış" uyarısı gösterilir.

### 2.2. Beni Hatırla (Remember Me) Seçeneği
*   Giriş paneline modern bir checkbox eklenecektir.
*   Seçili olduğunda: Oturum `localStorage` üzerinde saklanır (varsayılan persistence). Ek olarak son giriş yapılan kullanıcı adı tarayıcıda saklanır ve bir sonraki girişte alan doldurulmuş gelir.
*   Seçili olmadığında: Supabase Auth oturum kapatıldığında veya tarayıcı sekmesi kapatıldığında sıfırlanacak şekilde yapılandırılır ya da `sessionStorage` kullanılır.

---

## 3. Supabase Veritabanı Kurulumu (404 Hatası Çözümü)

Kaydolurken alınan `404 Not Found` hatası, Supabase veritabanında `profiles` tablosunun bulunmamasından kaynaklanmaktadır. Bu sorunun çözülmesi için, kullanıcının Supabase Dashboard -> **SQL Editor** sayfasına gidip aşağıdaki SQL sorgusunu çalıştırması gerekmektedir.

```sql
-- 1. Profiles Tablosu (Kullanıcı Profilleri)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  total_points integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Matches Tablosu (Maç Fikstürü)
create table public.matches (
  id text primary key,
  home_team text not null,
  away_team text not null,
  commence_time timestamp with time zone not null,
  home_odd numeric not null,
  draw_odd numeric not null,
  away_odd numeric not null,
  status text not null default 'pending',
  home_score integer,
  away_score integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Predictions Tablosu (Kullanıcı Tahminleri)
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id text references public.matches(id) on delete cascade not null,
  predicted_outcome text not null check (predicted_outcome in ('home', 'draw', 'away')),
  predicted_diff integer not null,
  is_calculated boolean default false not null,
  earned_points integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, match_id)
);

-- Row Level Security (RLS) Etkinleştirme
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

-- RLS Politikaları
create policy "Allow public read on profiles" on public.profiles for select using (true);
create policy "Allow individual insert/update on profiles" on public.profiles for all using (auth.uid() = id);

create policy "Allow public read on matches" on public.matches for select using (true);

create policy "Allow public read on predictions" on public.predictions for select using (true);
create policy "Allow individual predictions" on public.predictions for insert with check (auth.uid() = user_id);
create policy "Allow individual updates on open predictions" on public.predictions for update using (
  auth.uid() = user_id and 
  exists (
    select 1 from public.matches 
    where id = match_id and commence_time > now()
  )
);
```

---

## 4. UI Bileşenlerinin Detaylı Tasarım Güncellemeleri

### 4.1. `PredictionCard.tsx` (Tahmin Kartı)
*   **Bayraklar:** Emojiler (`🇹🇷`, `🇫🇷`) kaldırılacaktır. Onun yerine her ülke ismi için CSS/SVG tabanlı şık yuvarlak bayrak çerçeveleri veya metinsel ülke kısaltmaları kullanılacaktır (Lucide `Flag` ikonu ile kombine).
*   **Seçim Pill'leri:** 1, X, 2 seçim butonları neon sınır çizgileriyle ayrılacak. Seçili olduğunda mor degrade (`from-violet-600 to-indigo-600`) ile dolacak ve kutu çevresinde mor bir neon ışık (`shadow-glow`) oluşacaktır.
*   **Oran Bilgisi:** Küçük fontlu ve monospace karakterli yazılacak, premium durması sağlanacaktır.
*   **Gol Farkı Girişi:** Tamamen karanlık moda uygun, odaklanıldığında mor kenarlıklı olan minimalist sayı giriş alanı.

### 4.2. `Leaderboard.tsx` (Liderlik Tablosu)
*   Turnuva sıralaması hissi yaratmak için ilk üç sıra şu neon sınırlara sahip olacaktır:
    *   **1. Sıra:** Altın rengi gölge ve kenarlık (`border-amber-500/50 shadow-amber-500/10`).
    *   **2. Sıra:** Gümüş rengi gölge ve kenarlık (`border-zinc-400/50 shadow-zinc-400/10`).
    *   **3. Sıra:** Bronz rengi gölge ve kenarlık (`border-amber-700/50 shadow-amber-700/10`).
*   Lucide `Trophy` (1. sıraya altın sarısı) ve `Award` (diğer sıralara) ikonları kullanılacaktır.

---

## 5. Doğrulama Planı
1.  **Birim Testleri:** `vitest` ile `src/utils/scoring.test.ts` testlerinin sorunsuz çalıştığı doğrulanacaktır.
2.  **Derleme Kontrolü:** `npm run build` komutu çalıştırılarak sıfır hata ile üretim paketinin oluştuğu teyit edilecektir.
3.  **Arayüz Kontrolü:** Bileşenlerin render testleri yapılarak hiçbir emojinin kalmadığından emin olunacaktır.
