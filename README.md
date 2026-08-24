# Launchly

O‘zbekiston dasturchilari, startapchilari, investorlari va mijozlari uchun:

1. loyiha showcase;
2. roast/feedback/rating (1–5: G‘oya, Dizayn, Ijro);
3. mahsulotlar vitrinası (bepul/pullik);
4. developer marketplace (buyurtma bozori);
5. order → proposal → chat platformasi.

**Texnologiyalar:** Next.js 14 (App Router) · TypeScript · TailwindCSS · Supabase (Auth, Postgres, Storage, Realtime) · Lucide icons · Uzbek Latin interfeys · SEO (dynamic metadata, JSON-LD, sitemap, robots).

Barcha ma’lumotlar (loyihalar, mahsulotlar, buyurtmalar, profillar, fikrlar, baholar, like/save, statistika) faqat Supabase’dan o‘qiladi. **Hech qanday fake/demo ma’lumot yo‘q** — bo‘sh bo‘lsa chiroyli empty state ko‘rsatiladi.

---

## 1. Lokal ishga tushirish

```bash
npm install
cp .env.example .env.local
# .env.local ichiga Supabase qiymatlarini yozing:
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run dev
```

> **Supabase env sozlanmagan bo‘lsa:** sayt baribir ishlaydi — banner orqali ogohlantiradi, bo‘limlar empty state ko‘rsatadi. Build va UI qalqi bo‘lmaydi.

### Tezkor tekshiruv

```bash
npm run build   # production build
npm run lint    # ESLint (next/core-web-vitals)
```

---

## 2. Supabase sozlash

1. [supabase.com](https://supabase.com) dan loyiha yarating.
2. **SQL Editor** dan `supabase/schema.sql` faylini to‘liq yuboring. Fayl **idempotent** — bir necha marta ishlash xavfsiz.

   Schema nima yaratadi:
   - `profiles`, `projects`, `project_comments`, `project_ratings`, `project_likes`, `products`, `orders`, `order_proposals`, `messages`, `project_events`, `saved_projects` jadvallari;
   - `developer / investor / admin` rollari;
   - `auth.users` uchun profil triggeri (signup’dagi `role` metadatasidan);
   - project `slug`, status enumlar (`idea, mvp, in_progress, launched` / `new, proposals, selected, in_progress, completed` / `pending, accepted, rejected`);
   - **triggerlar:** profile rating aggregation, `likes_count`, `views_count`/`try_clicks`, birinchi proposal → order status `proposals`, accepted proposal → `completed_orders`;
   - **RPC funksiya:** `accept_proposal` (atomic: tanlangan → accepted, qolg‘anlar → rejected, order → selected), `reject_proposal`, `get_order_contact` (faqat accepted developer uchun kontakt ochadi);
   - **`open_orders` view** — public buyurtma ro‘yxati (kontakt ustunlari YO‘Q);
   - `project-images` Storage bucket (public) + upload policylar;
   - barcha jadvallarga RLS: developer faqat o‘z project/product’ini tahrirlaydi; foydalanuvchi faqat o‘z like/save/comment/proposal’ini boshqaradi; order kontaktlari public API orqali ochilmaydi;
   - Realtime: `project_comments` va `messages` `supabase_realtime` publication’ga qo‘shiladi.

3. **Eski schema ishlatilgan bazalarda** (2026-08-24 dan oldin yaratilgan) qo‘shimcha migration yuboring:

   ```
   supabase/migrations/20260824_harden_orders.sql
   ```

   U xavfsiz bo‘lgan orders RLS’ni o‘rnatadi, `open_orders` view va RPC’larni qo‘shadi, triggerlar va Realtime’ni ta’minlaydi. Toza bazada qo‘shimcha ishlar sizga kerak emas (schema.sql hammasini qamrab oladi), lekin yuborish zarar bermaydi.

4. **Authentication sozlashi** (Dashboard → Authentication):
   - Email/Password provider yo‘q (default yoqilgan).
   - Google kerak bo‘lsa: Providers → Google — Client ID/Secret kiriting, redirect URL ga `https://SIZNING-DOMAIN.uz/auth/callback` ni qo‘shing.
   - Email tasdiqlash (confirm email) yoqilgan bo‘lsa, callback orqali sessiya o‘z-o‘zidan tekshiriladi.

5. `.env.local` ga `https://...` va anon key’ni yozib, `npm run dev`.

### Xavfsizlik eslatmalari

- `orders` jadvali **public SELECT sizga berilmaydi**: faqat buyurtmachi (va admin) o‘z qatorini o‘qiydi. Public ro‘yxat faqat `open_orders` view orqali — u kontakt ustunlarini umuman proektsiyalamaydi.
- `accept_proposal` / `reject_proposal` / `get_order_contact` — `SECURITY DEFINER`, `anon`/`public` dan `REVOKE` qilingan, ichida ruxsat tekshiruvi bor.
- Realtime jadvallar RLS bilan cheklangan: guest fikrlarni jonli ko‘radi, chat faqat ishtirokchilarga.

---

## 3. Vercel’ga deploy

**Oldingi xatolik:** `No Output Directory named "public" found after the Build completed` — bu Vercel’ning Node (boshqa framework) presedasi edi. Endi `vercel.json` Next.js framework’ini aniq belgilaydi:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

**Qadam-qadam:**

1. [vercel.com](https://vercel.com) da repository’ni import qiling (GitHub).
2. Import sahifasida **Framework: Next.js** avtomatik tanlanadi (`vercel.json` bilan kafolatlanadi).
3. **Build Settings** tekshiring:
   - Build Command: `npm run build`
   - Output Directory: `.next` (public BO‘LSIN)
4. **Environment Variables** qo‘shing (Project → Settings → Environment Variables, barcha muhitlar uchun):

   | Variable | Misol |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzcompany.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (anon key — public key, xavfsiz) |
   | `NEXT_PUBLIC_SITE_URL` | `https://launchly.vercel.app` (yoki o‘z domainingiz) |

5. Deploy. `NEXT_PUBLIC_*` qiymatlar build vaqtiida kodga yoziladi — env o‘zgargach **qayta deploy** talab etiladi.
6. Supabase’da ko‘rsatilganidek `/auth/callback` redirect URL’ini Vercel domeningizga qo‘shing (Google OAuth va email tasdiqlash uchun).

> `service_role` key hech qayerda kerak emas — UI va server Supabase auth orqali (RLS bilan) ishlaydi.

---

## 4. Routelar

| Route | Tavsif |
|---|---|
| `/` | Bosh sahifa: so‘nggi loyihalar, ochiq buyurtmalar, mahsulot vitrinası |
| `/projects` | Loyihalar: qidiruv, kategoriya, status, saralash |
| `/projects/new` | Loyiha joylash (faqat developer): screenshot upload (Storage) |
| `/p/[slug]` | Loyiha sahifasi: server-rendered, dynamic metadata, OG, JSON-LD `SoftwareApplication`, like/save, real view/try-click event, realtime commentlar, 1–5 rating (upsert) |
| `/products` | Mahsulotlar: detail modal, joylash modal (bepul/pullik, narx/valyuta) |
| `/marketplace` | Ochiq buyurtmalar (`open_orders` view), beznom yoki kirgan holda buyurtma berish, detail modal, developer taklifi |
| `/orders/[id]` | Buyurtma sahifasi: takliflar (client select/reject), selected tomonlarga kontakt, ishtirokchilar chati (Realtime) |
| `/saved` | Saqlangan loyihalar |
| `/dashboard` | Real statistika (ko‘rish, demo bosish, like, fikr, baho), loyihalar/buyurtmalar/takliflar, profil to‘liqligi + tahrir |
| `/u/[id]` | Publik profil (developer va investor), dynamic metadata |
| `/auth/login` · `/auth/signup` · `/auth/callback` · `/auth/logout` | Email/password, rol tanlash, Google OAuth, session middleware |
| `/sitemap.xml` · `/robots.txt` | Faqat `launched` loyihalar + developer profillar sitemap’ga kiradi |

---

## 5. Ma’lumotlar modelining qisqacha xulosasi

- `profiles` — auth.users bilan 1:1, rating/completed_orders triggerlar bilan saqlanadi.
- `projects` — `slug` unique; `images[]` Storage public URL’lari; sanog‘ichlar trigger bilan.
- `order_proposals` — `(order_id, developer_id)` unique; status o‘zgarishi `completed_orders` ni yangilaydi.
- `messages` — `receiver_id` nullable (buyurtma kanali); RLS faqat ishtirokchilarga.
- `project_events` — `view` / `try_click` (sanog‘ich triggerlari bor).

## 6. Loyiha tuzilishi

```
app/            # Next.js App Router (server components + client component’lar)
components/     # UI: kartalar, explorerlar, formalar, chat, modal
lib/            # supabase-browser/server clientlar, tiplar, utils
middleware.ts   # Supabase session (cookie) yangilash
supabase/       # schema.sql + migrations/
vercel.json     # Vercel: Next.js framework, output .next
```
