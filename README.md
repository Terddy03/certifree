# CertiFree

A minimal, student-friendly catalog of free certifications.

## Recent updates
- Removed Career Impact, ratings, reviews, and difficulty UI.
- Provider now displays beneath the title; description shows alongside it.
- Favorites fixed: heart fills red when selected; added Favorites page at `/favorites`.
- “I am taking this cert” added: toggles your taking status and shows number of people taking each certification (via `user_progress`).
- Email confirmations optional; if disabled in Supabase, signup logs in immediately.

## Database
- Favorites: `public.user_favorites (user_id, certification_id)` with RLS so users manage their own favorites.
- Taking: `public.user_progress` uses `status = 'in_progress'` to indicate “taking.” Counts are aggregated per certification.
- You can manually update your database via SQL; schema is in `sql/schema.sql`.

## Development
- Vite + React + TypeScript + shadcn/ui
- Supabase for auth, data, and realtime

## Scripts
- `npm run dev` – start the app
- `npm run build` – production build

## Notes
- To enable/disable email confirmation: Supabase Dashboard → Auth → Providers → Email.
- Configure SMTP (Resend or other) in Supabase Dashboard → Auth → Email → SMTP.
