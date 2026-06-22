# Walkthrough - HTalks Dünya Kupası Ligi

Tüm gereksinimler doğrultusunda "HTalks Dünya Kupası Ligi" projesinin ilk versiyonu başarıyla tamamlanmıştır.

## Gerçekleştirilen İşler
1. **Veri Modeli:** `profiles`, `matches` ve `predictions` tabloları Supabase/Postgres veritabanında yapılandırıldı. RLS güvenlik kuralları tanımlandı.
2. **Dinamik Puanlama:** Kazanan oranının 10 katı tam sayı puanı ile en yakın farkı tahmin edene +1 puan veren algoritmalar geliştirildi ve birim testlerle doğrulandı.
3. **Arayüz (Dashboard):** React & Tailwind tabanlı, Liderlik Tablosunu ve Tahmin alanlarını birleştiren modern tek ekran (Approach A) arayüzü kuruldu.
4. **shadcn/ui Entegrasyonu:** Projeye shadcn/ui kuruldu, TS/Vite path alias ayarları yapıldı ve monokrom/minimalist renk teması `index.css` ve `tailwind.config.js` dosyalarında entegre edildi.
5. **PredictionCard Bileşeni:** Temiz tipografi ve tamamen siyah/beyaz/gri monokrom tasarımına sahip modern [PredictionCard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/PredictionCard.tsx) bileşeni oluşturuldu.
6. **VCS Commits:** Her adım git reposuna ayrı taahhütler (commits) halinde kaydedildi.
7. **Build:** Proje `npm run build` ile başarıyla derlendi.

### 6. WCTurkiye Marka Dönüşümü (Brand Rebranding)
- İsim hakları sebebiyle uygulamadaki tüm "HTalks" ve "htalkslig" isimlendirmeleri ve domain referansları **WCTurkiye** ve `wcturkiye.com` olarak güncellendi.
- Supabase dummy e-posta formatı `@wcturkiye.com` yapıldı.

### 7. Seçici ve Dinamik API Senkronizasyon Optimizasyonu
- API kotalarını korumak için 3 seviyeli bir dinamik cooldown mekanizması geliştirildi (Canlı maç saatlerinde 20 dk, yakındaki maçlarda 2 saat, maç olmayan günlerde 12 saat).
- Oranlar (`/odds`) ve Skorlar (`/scores`) istekleri birbirinden ayrıldı. Oranlar günde maksimum 2 kez güncellenirken, aktif maç saatlerinde sadece skorlar çekilerek kota harcaması %50 azaltıldı.

### 8. Sosyal Medya Paylaşım Banner'ı Entegrasyonu
- X (Twitter) vb. sosyal ağlarda paylaşıldığında link önizlemesi olarak görünmesi için 1200x630 çözünürlüğünde premium bir sosyal medya meta görseli (/public/social-banner.png) oluşturulup projenin meta etiketlerine bağlandı.

---

## Yeni Eklenen Sosyal Medya Banner Görseli

![WCTurkiye Sosyal Medya Banner'ı](file:///C:/Users/Semih/.gemini/antigravity/brain/32c4f974-a466-483a-b795-e90e5310e2d0/wcturkiye_social_banner_1782121724044.png)

---

## Verification Results

### Automated Tests
- Running `npm run build` completed successfully, verifying that all TypeScript, Vite, and module compilation checks pass.
- Running `npx vitest run` verified that all scoring tests pass successfully.

### Manual Verification Instructions
1. Ensure your `.env` contains your correct `VITE_THE_ODDS_API_KEY`.
2. Open the application. Log in using a registered user profile.
3. Observe that mock/demo matches are deleted, and the new real fixtures list is populated.
4. Verify that you can switch between "Günün Maçları" (only showing upcoming games starting in the next 24 hours, excluding completed ones) and "Tamamlananlar" (showing completed fixtures).
5. Click on the Leaderboard header or the "Tümünü Göster" button, and verify that the searchable modal pops up, showing the full standings.
6. Paylaşımlarda `social-banner.png` dosyasının doğru yüklendiğini kontrol edin.
