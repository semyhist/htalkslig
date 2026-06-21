# HTalks Hastaları Dünya Kupası Tahmin Ligi

Arkadaşlarınla yarış, FIFA Dünya Kupası maç tahminleri yap, puan topla ve liderlik tablosuna çık!

## Özellikler

- 🏆 **Gerçek Zamanlı Maç Verileri** — The Odds API entegrasyonu ile güncel maçlar ve oranlar
- ⚡ **24 Saatlik Kayan Pencere** — Yalnızca yaklaşan 24 saatteki maçlar tahmin edilebilir
- 🎯 **Otomatik Puanlama** — Maç sonuçları otomatik çekilir, puanlar anında hesaplanır
- 📊 **Canlı Liderlik Tablosu** — Tüm katılımcıları görmek için genişletilebilir arama destekli tablo
- 🔐 **Kullanıcı Adı + Şifre Auth** — E-posta gerektirmeyen basit kayıt ve giriş sistemi
- 💾 **Supabase Backend** — Tüm maçlar, tahminler ve profiller veritabanında saklanır
- 🎨 **Premium Dark UI** — Glassmorphism, neon aksan ve micro-animasyonlar

---

## Kurulum

### Gereksinimler

- Node.js 20+
- Supabase hesabı
- The Odds API anahtarı

### Adımlar

```bash
# 1. Bağımlılıkları kur
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle

# 3. Supabase şemasını çalıştır
# Supabase Dashboard → SQL Editor → supabase/migrations/20260621000000_init.sql

# 4. Geliştirme sunucusunu başlat
npm run dev

# 5. Production build
npm run build
```

### Ortam Değişkenleri

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
VITE_THE_ODDS_API_KEY=your_odds_api_key
```

### Supabase Ayarları

1. Supabase Dashboard → **Authentication → Providers → Email** → **Confirm email** seçeneğini **KAPATIN**
2. SQL Editor'de `supabase/migrations/20260621000000_init.sql` dosyasını çalıştırın

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Vanilla CSS |
| Backend | Supabase (PostgreSQL + Auth) |
| API | The Odds API (v4) |
| Icons | Lucide React |
| Test | Vitest |

---

## Yasal

Bu platform yalnızca eğlence ve sosyal rekabet amaçlı bir **ücretsiz tahmin oyunudur**. Gerçek para, bahis veya kumar içermez. Platformda kazanılan puanların herhangi bir maddi karşılığı yoktur.

---

**Yapımcı:** [Semih Aydın](https://semihaydin.dev)
