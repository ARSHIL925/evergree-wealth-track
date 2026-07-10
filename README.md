# Evergreen Wealth Track

Mindful money for India — expense tracking, budgeting, subscriptions, and calculators.

## Tech Stack

- TanStack Start (React 19 + Vite 7)
- Tailwind CSS v4
- Supabase (auth + database)
- next-themes (light/dark mode)
- shadcn/ui + Radix UI

## Local Development

### Prerequisites

- Node.js 20+ (or Bun 1.1+)
- npm / bun / pnpm

### Setup

```bash
# 1. Install dependencies
npm install
# or: bun install

# 2. Copy env file (already committed as .env for convenience)
#    Edit .env if you want to point at your own Supabase project.
cat .env

# 3. Start the dev server
npm run dev
# or: bun run dev
```

The app runs at `http://localhost:8080`.

### Environment Variables

The `.env` file in the project root contains everything needed to run locally:

```
SUPABASE_URL              # Server-side Supabase project URL
SUPABASE_PUBLISHABLE_KEY  # Server-side publishable (anon) key
SUPABASE_PROJECT_ID       # Server-side project ref
VITE_SUPABASE_URL         # Client-side URL (same value as SUPABASE_URL)
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

`VITE_*` variables are exposed to the browser; the un-prefixed ones stay on the server.

### Scripts

| Command            | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Start the dev server on port 8080          |
| `npm run build`    | Production build                           |
| `npm run preview`  | Preview the production build               |
| `npm run lint`     | ESLint check                               |
| `npm run format`   | Prettier format                            |

## Authentication

Auth is powered by Supabase and supports:

- Email + password with mandatory email verification
- Google OAuth (via `@lovable.dev/cloud-auth-js` broker)
- Password reset via `/reset-password`

Routes under `src/routes/_authenticated/` require a signed-in user.

## Theme-Aware Logo

`src/components/EvergreenLogo.tsx` swaps between `evergreen-mark-light.png`
and `evergreen-mark-dark.png` automatically based on the resolved theme
from `next-themes`.
