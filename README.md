# Launchly

O'zbekistonlik dasturchilar va startapchilar uchun loyiha showcase, samimiy feedback va buyurtmalar bozori.

## Ishga tushirish

```bash
npm install
cp .env.example .env.local
npm run dev
```

`NEXT_PUBLIC_SUPABASE_URL` va `NEXT_PUBLIC_SUPABASE_ANON_KEY` mavjud bo'lmasa, interfeys ko'rib chiqish uchun tayyor demo ma'lumotlar bilan ishlaydi. Supabase ulash uchun `supabase/schema.sql` faylini SQL Editor'da ishga tushiring. Bu fayl:

- developer / investor / admin rollari;
- loyiha, mahsulot, buyurtma, proposal, comment va Realtime chat jadvallari;
- like, save, ko'rish va demo bosish eventlari;
- yangi foydalanuvchi uchun profil triggeri;
- jadval va Storage uchun RLS qoidalarini yaratadi.

## Asosiy oqimlar

- **Kashf etish:** haftaning top loyihasi, so'nggi loyihalar va buyurtmalar.
- **Loyihalar:** kategoriya va matn bo'yicha filtr, loyiha tafsilotlari, like va roast modal oynasi.
- **Mahsulotlar:** ishga tushgan mahsulotlar vitrinasi.
- **Buyurtmalar:** ochiq buyurtmalar va proposal yuborish oynasi.
- **G'oliblar:** oylar bo'yicha top loyihalar arxivi.
- **Kabinet:** ko'rishlar, qo'llab-quvvatlashlar, roastlar va faollik ko'rsatkichlari.

`app/sitemap.ts` va `app/robots.ts` SEO uchun tayyorlangan. Real loyihalarda Supabase'dan keladigan `projects` ma'lumotlari bilan dynamic `/p/[slug]` routelariga kengaytirish mumkin.
