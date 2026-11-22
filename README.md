# DeckFlix: deploy guide

DeckFlix is a single-page site. Vercel hosts it, and a free Supabase project powers
room codes (live games between phones) and the rankings. Points are virtual only.

## 1. Create the Supabase project (free, about 3 minutes)
1. Go to https://supabase.com, sign in, and choose **New project**. Any name and region
   (Singapore is closest to the Philippines). Save the database password somewhere safe.
2. When the project is ready, open **SQL Editor > New query**, paste everything from
   `supabase-setup.sql`, and press **Run**. This creates the rankings tables.
3. Open **Project Settings > API** (or **Connect**). Copy:
   - the **Project URL** (looks like `https://abcd1234.supabase.co`)
   - the **anon public** key (also called publishable key). It is safe to put in a website.
   Never use the `service_role` / secret key here.

## 2. Deploy on Vercel
1. Put this folder in a GitHub repo, or drag the folder into https://vercel.com/new.
2. Framework preset: **Other**. No build command. Output directory: the folder itself.
3. Before (or after) the first deploy, open **Settings > Environment Variables** and add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_ANON_KEY` = your anon public key
4. Redeploy so the settings take effect.

Alternatively, add Supabase from Vercel's **Storage / Marketplace** tab: it creates the
project and fills in the variables for you. You still need to run `supabase-setup.sql` once.

## 3. Check it works
- Open the site on your phone. The lobby shows **Players online now**.
- Rooms > pick a game > **Open room and get a code**. Send the code or link to a friend.
- Your friend opens the link (or enters the code under Join), picks a name, city and
  country, taps **I'm ready**, and you press **Start**.
- On phones, use **Add to Home Screen** to install DeckFlix like an app.

## How online play works
- The host's device runs the game. Each player only ever receives their own cards, over a
  private channel. If the host closes the app, the game ends for everyone.
- If a friend's connection drops, a bot plays for them; when they come back (or refresh),
  they get their seat back.
- Rankings use real finished games only: 25 points per win and 5 per game played.

## Files
- `index.html`: the whole app
- `api/config.js`: hands the public Supabase settings to the browser
- `vendor/supabase.js`: Supabase client library (v2), bundled so the site doesn't rely on a CDN
- `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `favicon.svg`: home-screen install
- `supabase-setup.sql`: run once in Supabase

## Known limits of this version
- Guest profiles live on each device (no passwords yet), so ranking entries can't be
  verified against an account. Fine for friends; add Supabase Auth before running anything public.
- The host's device is trusted to run the game fairly.

## Keep-alive (stops Supabase free-plan pausing)
`vercel.json` schedules a Vercel Cron job once a day (04:17 UTC) that calls `/api/keepalive`.
It runs two tiny read queries so the free Supabase project never counts as inactive.
Check it any time by opening `/api/keepalive` on your site — it should say `"ok": true`.

## Weekly backup
Every Sunday a GitHub Action (`.github/workflows/backup.yml`) copies all player records and
game results from Supabase into `backups/` in this repo: one dated file per week plus
`backups/latest.json`. Run it any time from **Actions > Weekly backup > Run workflow**.
Backup-only commits don't trigger a new Vercel deploy (see `ignoreCommand` in `vercel.json`).

To restore, give `backups/latest.json` (or a dated file) to Claude or any developer: the
`players` array goes back into `cv_players` and the `results` array into `cv_results`.
