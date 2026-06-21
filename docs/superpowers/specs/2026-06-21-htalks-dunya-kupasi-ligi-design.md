# HTalks Dünya Kupası Ligi - Teknik Tasarım Belgesi (Specification)

## 1. Proje Özeti
"HTalks Dünya Kupası Ligi", kullanıcıların Dünya Kupası maçları üzerine tahminler yaparak yarıştığı bir tahmin platformudur. Kullanıcılar maç sonuçlarını (1X2) ve gol farklarını tahmin ederler. Puanlama sabit değildir; gerçek bahis oranlarına dayalı dinamik çarpanlarla hesaplanır, böylece sürpriz sonuçları doğru bilenler daha yüksek puan kazanır.

## 2. Kullanıcı Arayüzü (UI/UX) - Yaklaşım A: Dinamik Tek Ekran Dashboard
Kullanıcı deneyimini en üst düzeyde tutmak amacıyla uygulama, tek sayfalık bir dashboard yapısında tasarlanacaktır.
*   **Sol Sütun (Liderlik Tablosu):** Tüm kullanıcıların toplam puanlarına göre sıralandığı dinamik bir liste. Kullanıcının kendi sırası belirgin şekilde vurgulanır.
*   **Orta Sütun (Tahmin Paneli & Fikstür):** "Bugün + Gelecek 3 Gün" içerisindeki maçların listelendiği alan. Maçların 1X2 oranları butonlar halinde sunulur. Kullanıcı kazananı seçtikten sonra, gol farkı tahmini için bir giriş alanı açılır.
*   **Sağ Sütun / Modal (Kurallar & Kullanıcı İstatistikleri):** Puanlama sisteminin detayları, kullanıcının geçmiş tahmin başarıları ve isabet oranları.
*   **Mobil Tasarım:** Sütunlar dikey olarak katlanır. Alt kısımdaki sabit bir bar veya tab-bar ile Liderlik ve Fikstür arasında hızlı geçiş sağlanır.

## 3. Veri Modeli ve Veritabanı Şeması (Supabase / PostgreSQL)

### 3.1. `profiles` Tablosu
Supabase Authentication ile oluşturulan kullanıcıların herkese açık profil bilgilerini ve toplam puanlarını tutar.
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  total_points integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 3.2. `matches` Tablosu
The-Odds-API'den çekilen veya manuel girilen maçların bilgilerini ve bahis oranlarını tutar.
```sql
create table public.matches (
  id text primary key, -- The-Odds-API maç kimliği
  home_team text not null,
  away_team text not null,
  commence_time timestamp with time zone not null,
  home_odd numeric not null,
  draw_odd numeric not null,
  away_odd numeric not null,
  status text not null default 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  home_score integer,
  away_score integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 3.3. `predictions` Tablosu
Kullanıcıların maçlar için yaptığı tahminleri tutar.
```sql
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id text references public.matches(id) on delete cascade not null,
  predicted_outcome text not null, -- 'home', 'draw', 'away'
  predicted_diff integer not null, -- Gol farkı tahmini (Beraberlik için 0, ev sahibi kazanırsa pozitif, deplasman için negatif veya mutlak fark)
  is_calculated boolean default false not null,
  earned_points integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, match_id) -- Bir kullanıcı bir maça sadece bir kez tahmin yapabilir
);
```

## 4. Güvenlik ve RLS (Row Level Security) Kuralları
Supabase PostgreSQL üzerinde veri güvenliği RLS politikaları ile sağlanacaktır:
*   **`profiles`:** Herkes okuyabilir (`select`). Sadece oturum açmış kullanıcı kendi profilini oluşturabilir (`insert`) ve güncelleyebilir (`update`).
*   **`matches`:** Herkes okuyabilir (`select`). Yazma ve güncelleme yetkisi sadece sistem/admin rolündedir.
*   **`predictions`:** Herkes okuyabilir (`select`) - lig şeffaflığı için. Sadece oturum açmış kullanıcı kendi tahminini ekleyebilir (`insert`) ve maç başlamamışsa güncelleyebilir (`update`). Başkalarının tahminini değiştiremez veya silemez.

## 5. Dış API Entegrasyonu (The-Odds-API)
*   **Fikstür ve Oran Çekimi:** `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/` uç noktası kullanılarak yaklaşan Dünya Kupası maçları ve 1X2 oranları (h2h marketi) çekilir.
*   **Veri Güncelleme Sıklığı:** Netlify Background Function veya zamanlanmış bir GitHub Action/Serverless Cron ile günde 3-4 kez çalışarak yaklaşan maçları günceller.
*   **API Anahtarı Güvenliği:** API anahtarı frontend tarafında kesinlikle barındırılmaz. Netlify Environment Variables içinde saklanır ve sadece sunucu tarafında (Netlify Edge Functions / Supabase Edge Functions) kullanılır.

## 6. Dinamik Puanlama Algoritması

### 6.1. Doğru Maç Sonucu Puanı (1X2)
*   Kullanıcı kazananı veya beraberliği doğru bildiğinde, o sonucun küsuratlı bahis oranının **10 katı** tam sayıya yuvarlanarak (Math.round veya zemin değer) puan olarak verilir.
    *   Örnek: Ev sahibi galibiyet oranı `1.65` ise ve ev sahibi kazandıysa, kullanıcı `17 Puan` alır.
    *   Örnek: Beraberlik oranı `4.33` ise ve maç berabere bittiyse, kullanıcı `43 Puan` alır.
    *   Yanlış tahminde bulunulursa bu aşamadan `0 Puan` alınır.

### 6.2. En Yakın Gol Farkı Bonusu (Margin Bonus)
Maç bittiğinde o maç için tahmin yapan tüm kullanıcılar taranır:
*   Her tahminin **tahmin edilen gol farkı** ile **gerçekleşen gol farkı** arasındaki mutlak fark (hata payı) hesaplanır.
    *   *Gol Farkı Tanımı:* `Ev Sahibi Skor - Deplasman Skor`. (Örn: Maç 3-1 bittiyse gerçek fark `+2`, 1-2 bittiyse `-1`, berabere bittiyse `0`).
    *   *Kullanıcı Tahmin Farkı:* Kullanıcının girdiği yönlü fark (Örn: "Ev sahibi 2 farkla kazanır" -> `+2`, "Deplasman 1 farkla kazanır" -> `-1`, "Beraberlik" -> `0`).
    *   *Hata (Error):* $|Fark_{Gercek} - Fark_{Tahmin}|$
*   Tüm tahminler arasında en düşük hata değerine sahip olan kullanıcı(lar) tespit edilir.
*   En yakın tahmini yapan bu kullanıcıların her birine **+1 Bonus Puan** eklenir. Bu puanı almak için 1X2 sonucunu doğru tahmin etme şartı aranmaz; sadece gol farkı tahmininin diğer kullanıcılara göre en yakın olması yeterlidir.

## 7. Doğrulama ve Test Planı
*   **Birim Testleri (Unit Tests):** Puanlama algoritması, özellikle oran yuvarlama ve en yakın gol farkı hesaplama mantığı (aynı yakınlıkta birden fazla kazananın olması dahil) Jest/Vitest ile test edilecektir.
*   **Veritabanı Entegrasyon Testleri:** Tahmin kaydetme, maç güncelleme ve tetikleyicilerle puanların kullanıcılara yansıtılması işlemleri mock verilerle test edilecektir.
