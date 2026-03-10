# 🎧 Soundscapes

Curate your own ambient vibe. Layer sounds, pair books, and build a personal sonic environment — all powered by AI.

**Live:** [nilaerturk.com/soundscapes](https://nilaerturk.com/soundscapes/)

---

## Features

- **AI sound search** — describe a vibe and Gemini + Freesound scout the best matching ambient tracks
- **Layered mixer** — stack multiple sounds with individual volume controls
- **Per-user settings** — your volume mix is saved to your account and persists across sessions
- **Book pairings** — attach books that match the vibe via Google Books
- **Public & private soundscapes** — share with the world or keep it for yourself
- **Auth** — email/password with confirmation via Supabase Auth

## Tech Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, Mantine UI
- **Backend** — Supabase (database, auth, edge functions, RLS)
- **AI** — Google Gemini 1.5 Flash
- **APIs** — Freesound, Pexels, Google Books

## Local Setup

```bash
git clone https://github.com/nilae2001/soundscapes
cd soundscapes
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

## Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=
```

> The Pexels, Freesound, Gemini, and Google Books keys live in Supabase edge function secrets and are never exposed to the client.
