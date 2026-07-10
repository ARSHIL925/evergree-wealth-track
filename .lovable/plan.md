## Goal
Rebuild **Evergreen Wealth Track** (personal finance + subscription app) on the current TanStack Start template with all 13 requested features. Indian-first (INR default, UPI, Razorpay).

## Phase 1 — Foundation (no external accounts needed)

1. **Enable Lovable Cloud** (auth + Postgres + storage + server fns).
2. **Design system** (`src/styles.css`): warm, human, professional palette using color theory — deep teal `#0F766E` primary + warm amber `#F59E0B` accent + neutral slate, dual light/dark tokens (oklch). Inter + Fraunces pairing. Soft shadows, rounded-2xl, generous spacing.
3. **Theme toggle** (`next-themes`-style provider, persisted, system default).
4. **Routes** (file-based, each with full SEO `head()`):
   - `/` landing (principles + features instead of "rejected features")
   - `/auth` (sign-in + sign-up tabs, real Supabase auth)
   - `/_authenticated/dashboard`
   - `/_authenticated/profile` (avatar upload, name, currency pref, UPI ID)
   - `/_authenticated/expenses` (multi-currency, INR default, totals)
   - `/_authenticated/calculator` (basic + financial; "Add to expenses" button)
   - `/_authenticated/subscriptions` (Razorpay UPI/cards/netbanking)
   - `/blog` + `/blog/$slug` (auto-refreshing monthly feed)
   - `/sitemap.xml`, `/robots.txt`

## Phase 2 — Backend schema (one migration)

Tables (all in `public`, with grants + RLS):
- `profiles` (user_id PK, display_name, avatar_url, preferred_currency default `INR`, upi_id) + trigger on `auth.users` insert.
- `expenses` (id, user_id, amount NUMERIC, currency, category, note, occurred_at).
- `subscriptions` (id, user_id, plan, amount_inr, status, razorpay_subscription_id, billing_cycle).
- `payments` (id, user_id, amount_inr, method [`upi`/`card`/`manual`/`netbanking`], status, razorpay_payment_id, upi_txn_ref, notes).
- `blog_cache` (month TEXT PK, posts JSONB, fetched_at) — refreshed monthly.
- `app_roles` enum + `user_roles` table + `has_role()` security-definer fn (admin role).

Server functions (`src/lib/*.functions.ts`):
- `expenses.functions.ts` — list/add/delete/convert with FX rates.
- `currency.functions.ts` — fetch + cache rates from `exchangerate.host` (no key).
- `profile.functions.ts` — get/update, signed-URL avatar upload.
- `blog.functions.ts` — monthly fetch from dev.to API (`tag=personalfinance`), cached.
- `subscription.functions.ts` — create Razorpay order/subscription, verify signature.
- `notify-admin.functions.ts` — sends Lovable Emails to admin on new signup (DB trigger → enqueue).

Storage: `avatars` bucket (public read, owner write).

## Phase 3 — Integrations

- **Razorpay**: server fn creates order → client opens Razorpay Checkout (`checkout.razorpay.com`) → webhook at `/api/public/webhooks/razorpay` verifies HMAC and updates `payments`/`subscriptions`. Requires `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — I'll ask for these via `add_secret` after the UI is built.
- **UPI manual flow**: generates `upi://pay?pa=...&am=...&cu=INR` deep link + QR code; user pastes UPI reference, server marks `payments.status='pending_verification'` for admin.
- **Admin notification**: DB trigger on new `auth.users` → enqueue email via Lovable Emails to `ADMIN_EMAIL` secret.
- **Blog**: dev.to public API (no key) for monthly personal-finance articles; cached in `blog_cache`, refreshed when month rolls.
- **Currency**: `exchangerate.host` free public API; cached 24h.

## Phase 4 — Polish, SEO, security

- Unique `head()` per route (title, description, OG, Twitter, canonical).
- Sitemap + robots.
- `bun audit` review; pin deps; remove unused.
- Input validation with Zod on every server fn.
- RLS scoped to `auth.uid()`; admin checks via `has_role()`.
- 404 + error boundaries on every loader.

## Technical notes
- Auth gate: integration-managed `_authenticated/route.tsx`.
- Avatars stored in Supabase Storage `avatars` bucket; profile page uploads via signed URL.
- Theme: small `ThemeProvider` writes `class="dark"` on `<html>`, persists in `localStorage`, respects `prefers-color-scheme`.
- Calculator state lives in URL/local state; "Add to expenses" pre-fills the expense form via search params.
- Razorpay script loaded lazily on subscriptions page only.

## What needs your input later
After Phase 1-2 UI ships I'll request these secrets (one prompt): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `ADMIN_EMAIL`, and (after email domain) verify the sender. Until then UPI/manual flows work; Razorpay checkout stays in test mode with placeholder keys.

## Out of scope (be explicit)
- True "bank integration" beyond Razorpay (Plaid/account-aggregator) — requires regulated KYC/AA license in India; Razorpay covers netbanking from 50+ banks at checkout which is the practical equivalent.
- Real-money UPI auto-settlement without Razorpay — not possible without a PSP.

Approve and I'll start with Phase 1.