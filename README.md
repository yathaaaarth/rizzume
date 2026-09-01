# Rizzume

Dating, for people who work. Rizzume is a dating app for corporate
professionals: verified job title/company on every profile, swipe to match,
then chat.

## Stack

- Vite + React + TypeScript + Tailwind CSS v4
- Supabase (Postgres, Auth, Storage, Realtime) as the backend
- React Router for client-side routing

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

The app expects a Supabase project with the schema in this repo already
applied (profiles, swipes, matches, messages — see below). A project has
already been provisioned and its URL/key are in `.env.example`.

## Data model

- **profiles** — one row per user (name, bio, company, job title, industry,
  seniority, photos). Auto-created (blank) on signup via an `auth.users`
  trigger, filled in during onboarding.
- **swipes** — every like/pass a user records.
- **matches** — auto-created by a Postgres trigger the moment two users have
  both liked each other.
- **messages** — chat scoped to a match, delivered live via Supabase
  Realtime.

All tables have row-level security: users can only write their own data,
and can only read matches/messages they're a participant in. Profile photos
live in a public `profile-photos` storage bucket, scoped per-user by folder.

## App flow

`/` → `/signup` or `/login` → `/onboarding` (build your profile) →
`/discover` (swipe) → mutual like opens a match modal → `/matches` → `/chat/:matchId`.

## Notes

This was scaffolded end-to-end (schema, auth, swipe/match logic, realtime
chat) in one pass. It has not yet been tested against live Supabase network
calls from an unrestricted environment — do a manual pass through
signup → onboarding → swiping → matching → chat with two test accounts
before shipping.
