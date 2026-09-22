# قوالب معايدة درب · Darb Eid Greetings Platform

Internal web platform that lets every Darb employee generate a branded Eid greeting card in seconds.
Pick a template, type your name, preview live, download a high-resolution PNG/JPG ready for WhatsApp, LinkedIn, or Instagram Stories.

---

## ✨ Features

- 🎨 **6 premium Eid Al-Adha templates** — built as inline SVGs for crisp infinite scaling
- ✍️ **Live preview** with auto-fit text sizing for long Arabic and English names
- 📐 **Three export formats** — Square (1080×1080), Story (1080×1920), Post (1200×630)
- 🌗 **Light + dark preview modes** with theme-aware UI
- 📱 **Mobile-first responsive** layout — works beautifully on phones and tablets
- 💾 **PNG / JPG export** at 2.5× pixel ratio for sharp social-media output
- 💬 **WhatsApp share** (native share sheet on mobile, `wa.me` fallback elsewhere)
- 🔳 **Optional QR code** linking to Darb's corporate site
- 🛡️ **Admin dashboard** — upload new templates, edit titles, visually drag the name to any position, tune font / colour / alignment
- 🇸🇦 **Arabic RTL** end-to-end with `Tajawal` + `Cairo` web fonts

---

## 🧰 Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS 3** with custom Darb design tokens
- **html-to-image** for crisp DOM-to-PNG/JPG export
- **qrcode** for QR generation
- **framer-motion** for smooth gallery animations
- **lucide-react** icons

---

## 🚀 Local setup

```bash
# 1. Install dependencies (Node ≥ 18.17)
npm install

# 2. Copy environment variables
cp .env.example .env.local
#    then open .env.local and set:
#    - ADMIN_PASSWORD, ADMIN_SESSION_SECRET (server-only)
#    - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
#    - NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SHARE_TEXT

# 3. Start the dev server
npm run dev
# → open http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

---

## 🌐 Deployment

### Vercel (recommended — zero config)

1. Push this repo to GitHub / GitLab / Bitbucket.
2. Import the project at <https://vercel.com/new>.
3. Add every variable from `.env.example` in **Project Settings → Environment Variables** (secrets without `NEXT_PUBLIC_` are server-only).
4. Run `supabase_schema.sql` then `supabase_storage.sql` in the Supabase SQL editor.
5. Click **Deploy**.

### Any Node host

The app is a standard Next.js 14 build. `npm run build && npm start` will serve it on the configured port. Behind nginx/Cloudflare, terminate TLS upstream — the app has no special server-side dependencies.

### Static export (optional)

The seed templates are pre-rendered via `generateStaticParams`. The whole site can be exported as static HTML if your admin workflow doesn't require runtime template uploads:

```bash
# in next.config.mjs add: output: 'export'
npm run build
# → out/ folder is ready to host on any CDN
```

⚠️ Note: admin uploads use `localStorage`, so each browser keeps its own admin overrides. To share uploads across staff, swap the `src/templates/store.ts` storage layer for an API + database (see "Persisting templates" below).

---

## 🖼️ Adding new templates

### Option A — Upload via the admin dashboard (recommended for marketing)

1. Visit `/admin` and enter the admin password.
2. Use the **"رفع قالب جديد"** card to attach a 1080×1080 background image and a title.
3. The new template appears in the gallery instantly. Use **"حفظ"** to fine-tune the default name position.

### Option B — Ship a new code-defined template (recommended for richer SVG artwork)

1. Create `src/templates/designs/MyDesign.tsx` exporting an `ArtworkRenderer`:

   ```tsx
   import type { ArtworkRenderer } from '../types';
   export const MyDesign: ArtworkRenderer = ({ format }) => (
     <svg width="100%" height="100%" viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid slice">
       {/* … your artwork … */}
     </svg>
   );
   ```

2. Register it in `src/templates/seed.ts`:

   ```ts
   import { MyDesign } from './designs/MyDesign';

   export const BUILTIN_DESIGNS = {
     // …existing keys
     MyDesign,
   };

   export const seedTemplates: Template[] = [
     // …existing templates
     {
       id: 'my-design',
       title: 'قالبي الجديد',
       occasion: 'عيد مبارك',
       palette: { accent: '#F26B1F', bg: '#FFF8F0' },
       defaultNameStyle: {
         x: 50, y: 78, align: 'center',
         fontSizePct: 4.5, color: '#A93F09', maxWidthPct: 75,
         preset: 'bottom', weight: 700,
       },
       renderArtwork: MyDesign,
     },
   ];
   ```

3. Save — the gallery, editor and admin pick it up automatically.

---

## 🎨 Editing brand colours

All brand tokens live in **one place**:
[`tailwind.config.ts`](./tailwind.config.ts) → `theme.extend.colors.brand` (orange scale) and `theme.extend.colors.ink` (neutral gray scale).

Change the hex values once and every button, badge, gradient, and template default colour updates everywhere.

For CSS-level tokens (used by `globals.css` for raw `var(--color-brand)` references), edit
[`src/app/globals.css`](./src/app/globals.css) → `:root { … }` and `.dark { … }`.

---

## 🔑 Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `ADMIN_PASSWORD` | server | Password checked by `POST /api/admin-auth` (never shipped to the browser) |
| `ADMIN_SESSION_SECRET` | server | HMAC key for the signed `admin_token` session cookie. Rotate to log everyone out. Falls back to `sha256(ADMIN_PASSWORD)` if unset |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Bypasses RLS; used only by `/api/admin/db` and `/api/admin/upload` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Read-only access (RLS: SELECT only) + Realtime |
| `NEXT_PUBLIC_SITE_URL` | client | URL embedded in the optional QR code, `metadataBase` |
| `NEXT_PUBLIC_SHARE_TEXT` | client | Default text for WhatsApp share |

## 🛡️ Security model

- **Auth**: `/api/admin-auth` verifies the password in constant time and issues an HMAC-SHA256-signed, HttpOnly, `Secure`, `SameSite=Lax` cookie (`src/utils/adminSession.ts`). The password is never stored in a cookie. Sessions last 7 days; `POST /api/admin-logout` clears them; `GET /api/admin/session` tells the client gate whether it is still valid.
- **Brute force**: 5 failed attempts per IP → 15 min lock, plus a 300 ms delay on every failure. The limiter is in-memory (per serverless instance). For production add a Vercel WAF rate-limit rule on `/api/admin-auth` or swap in Upstash Ratelimit.
- **Middleware** (`src/middleware.ts`, Edge): rejects `/api/admin/*` without a valid session, marks `/admin` `no-store` + `noindex`.
- **Writes**: only `POST /api/admin/db` (service-role key) can mutate data. It whitelists tables, actions, columns and filter keys, caps bodies at 6 MB / 200 rows, and requires a same-origin `Origin`/`Sec-Fetch-Site` (CSRF). The anon key is SELECT-only via RLS.
- **Uploads**: `POST /api/admin/upload` puts raster images (magic-byte sniffed, ≤ 8 MB, no SVG) into the public Storage bucket `templates` and returns a CDN URL; large files use a signed direct-to-Storage PUT. Bucket + policies: `supabase_storage.sql`.
- **Headers/CSP**: set in `next.config.mjs`. `'unsafe-eval'` is only emitted in development (Next dev tooling); production CSP has no eval. API routes are `no-store`; `/fonts` and `/_next/static` are immutable-cached.
- **Realtime**: `wss://*.supabase.co` stays in `connect-src`.

## 🗃️ Persisting templates across users

The default store uses `localStorage`, which is per-browser. To share admin-uploaded templates with every employee:

1. Replace the helpers in [`src/templates/store.ts`](./src/templates/store.ts) (`loadStored`, `saveStored`, `addCustomTemplate`, `deleteTemplate`) with calls to your API (`GET / POST / DELETE /api/templates`).
2. Upload images to **S3 / Vercel Blob / R2** instead of stuffing data URLs into localStorage — the `StoredTemplate.source.kind === 'custom'` already takes any `imageDataUrl`, so you only need to swap data URLs for hosted URLs.
3. Optionally introduce a real Next.js `route handler` under `src/app/api/templates/route.ts`.

The rest of the UI doesn't need changes — it consumes templates through the `useTemplates()` hook.

---

## 📁 Project structure

```
darb-eid-platform/
├── public/                     # static assets (favicons, og:image)
├── exports/                    # runtime export directory (ignored by git)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # root layout (RTL, fonts, theme provider)
│   │   ├── page.tsx            # homepage (Hero + Gallery)
│   │   ├── globals.css         # global styles + CSS variables
│   │   ├── editor/[id]/page.tsx
│   │   └── admin/page.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── DarbLogo.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── TemplateCanvas.tsx  # ← the heart: composes artwork + name + QR
│   │   ├── TemplateCard.tsx
│   │   ├── Hero.tsx
│   │   ├── Gallery.tsx
│   │   ├── editor/             # FormatSwitch, PositionControls, EditorClient
│   │   └── admin/              # AdminGate, AdminDashboard, AdminTemplateEditor, AdminUploader
│   ├── templates/
│   │   ├── types.ts            # Template / NameStyle types + format dimensions
│   │   ├── seed.ts             # built-in design registry + seed list
│   │   ├── store.ts            # useTemplates() hook with localStorage persistence
│   │   └── designs/            # 6 SVG-based templates
│   └── utils/
│       ├── autoFit.ts          # name auto-fit shrinking
│       ├── exportImage.ts      # html-to-image wrapper + WhatsApp helper
│       └── cn.ts               # className helper
├── tailwind.config.ts          # ← brand colours live here
├── next.config.mjs
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🧪 Quality checklist

The platform has been built with these gotchas in mind:

- ✅ Arabic webfonts pre-loaded via `document.fonts.ready` before export → no Times New Roman fallback in screenshots.
- ✅ Preview is CSS-scaled, but the captured DOM stays at full pixel size → exports stay sharp at 2.5× pixel ratio.
- ✅ `html-to-image` `style.transform = 'none'` override prevents blurry exports when the preview is itself scaled.
- ✅ Native Web Share API on mobile (attaches the image), `wa.me` fallback on desktop.
- ✅ Validation: required-name with Arabic error message; blocks export and share until provided.
- ✅ Long names auto-shrink down to 55% via CSS transform — no layout re-flow, no blur.

---

## 📜 License

Internal use by **Darb**. Not distributed publicly.
