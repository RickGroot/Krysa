# Krysa · Prague Week

A rat-themed team planner for a conference week in Prague: the Rat Wall with a Krysa meme maker, flights, a day-by-day plan with "Now & next", ideas with voting, to-dos, a koruna/euro expense splitter and trip info. It installs on phones as a PWA, with optional push notifications for reminders and new posts.

Built for a real FrontKon trip. Everything in this repo is a made-up demo trip: the people, flights, costs and posts are invented, and the venues are public places.

> **Status: proof of concept.** Built for a few colleagues and one week. See [Shortcuts and known limits](#shortcuts-and-known-limits) before reusing it for anything bigger.

## Quick start (demo mode)

```bash
pnpm install --ignore-scripts
pnpm dev
```

Without Supabase keys the app runs in **demo mode**: a made-up trip stored in your browser. The demo is always "on": day 2 of the trip is today, so Now & next, reminders and the Rat Wall look alive whenever you open it. "Reset demo" in the banner starts over.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build into `dist/` |
| `pnpm build:notify` | The push notification function as one file (`dist/notify/index.js`) for the Supabase dashboard |
| `pnpm preview` | Serve the build locally (service worker active) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm typecheck` | Strict check of `src/lib`, `src/data` and tests, loose check of the UI |
| `pnpm seed [file]` | Load a seed file into Supabase (reads `.env`). Without a file it loads the demo trip |

## Setting up Supabase

Krysa keeps everything in its own Postgres schema (`krysa`) and storage bucket (`krysa-uploads`). Supabase has no folders, so the schema is the "subfolder": the app can live in a personal project next to other things, or in a project of its own.

There are no accounts or emails. Everyone gets in with a shared **trip code**: each device signs in anonymously the first time someone types the code (or opens an invite link), and the database checks the code before letting that device in.

1. Pick a project at [supabase.com](https://supabase.com), or create one.
2. In the **SQL editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates, all inside `krysa`:
   - `docs`: every document as JSON under a path like `events/abc123`, kept live with Realtime
   - `members`: devices that entered a valid code, and who's an owner
   - `codes`: the trip code(s), stored hashed and invisible to the app
   - `profiles`: display names
   - the private `krysa-uploads` bucket (20 MB per file)
   - row level security so only members can read or write, and only the poster or an owner can remove a Rat Wall post or its uploaded file
3. Set the trip code in the SQL editor. Use something that can't be guessed, like three random words. The owner code is optional and also lets that device remove anyone's Rat Wall posts:
   ```sql
   insert into krysa.codes (code_hash, is_owner) values
     (krysa.hash_code('your trip code'), false),
     (krysa.hash_code('your owner code'), true);
   ```
4. **Project Settings → Data API → Exposed schemas**: add `krysa`. Without this the app gets "permission denied" errors. See [Using custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas).
5. **Authentication → Sign In / Providers**: turn on **anonymous sign-ins**. See [Anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous). If other apps share this project, check that their tables don't let every signed-in user in (for example policies like `to authenticated using (true)`): anonymous users count as signed in too.
6. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (**Project Settings → API keys**; a legacy anon key also works as `VITE_SUPABASE_ANON_KEY`). Snippets for other frameworks name them differently (like `NEXT_PUBLIC_SUPABASE_URL`): the values are the same, but Vite only passes on names that start with `VITE_`.
7. Share the site and the code with the group. An invite link fills the code in for them: `https://<user>.github.io/<repo>/#trip=your-trip-code` (spaces become `%20`). The code is removed from the address bar as soon as the page opens.
8. Optionally load data: add `SUPABASE_SECRET_KEY` to `.env`, then run `pnpm seed` for the demo trip or `pnpm seed my-trip.private.json` for your own. Files ending in `.private.json` are ignored by git. Re-running only adds missing documents. Never commit or deploy the secret key.

**Changing the code:** `delete from krysa.codes;` and insert a new one. Devices that already joined stay in; `delete from krysa.members;` sends everyone back to the code screen.

## Push notifications (optional)

Phones get a ping for the reminders the app already shows (online check-in opening, leaving for the airport, the next plan item within the hour, to-dos due or overdue) and for new Rat Wall posts. A Supabase Edge Function, [`krysa-notify`](supabase/functions/krysa-notify/), does the sending. pg_cron calls it every minute, it works out what's due with the same code as the app ([`src/lib/notify.ts`](src/lib/notify.ts)), and it sends each reminder or post once. Check-in and to-do nudges wait out the night (22:00–08:00 Prague time), and new posts arrive silently at night.

1. **Deploy the function**, from the dashboard (nothing to install) or with the CLI:
   - **Dashboard:** run `pnpm build:notify`, which bundles the function into one file, `dist/notify/index.js`. Then go to **Edge Functions → Deploy a new function → Via Editor**, replace the example code with that file, name the function `krysa-notify` and click **Deploy function**. In the function's settings, turn off **Verify JWT with legacy secret**. The function checks its own token instead (step 3). That switch can turn itself back on when the function is updated, so check it after every redeploy.
   - **CLI** ([install](https://supabase.com/docs/guides/local-development/cli/getting-started); on Windows `scoop install supabase`): run `supabase login`, then `supabase functions deploy krysa-notify --project-ref <project-ref> --use-api --no-verify-jwt`. `--use-api` bundles on Supabase's side (no Docker) and lets the function import `src/lib`.
2. **Database → Extensions:** turn on `pg_cron` and `pg_net`. Then run [`supabase/schema.sql`](supabase/schema.sql) again (it's safe to re-run). It adds the push tables and functions, and a `created_at` column on `krysa.docs` so the function can tell which posts are new.
3. In the SQL editor, once. The first line stores where the function lives, the second creates the random token only pg_cron and the function know, and the third starts the schedule:
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/krysa-notify', 'krysa_notify_url');
   select vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text, 'krysa_notify_token');
   select cron.schedule('krysa-notify', '* * * * *', 'select krysa.run_notify()');
   ```
   The function creates the key pair pushes are signed with (VAPID) on its first run, so there are no keys to generate or copy.
4. In the app: **More → Notifications → Turn on**, on each device. iPhones and iPads only support this from the Home Screen: add Krysa there first (Share → Add to Home Screen), open it from there, then switch on. Notifications need the built app, so use `pnpm build` and `pnpm preview` to try them locally.

**Is it running?** Each run's answer lands in `net._http_response`:

```sql
select created, status_code, content from net._http_response order by created desc limit 5;
```

A healthy run returns 200 with `{"sent":0,"failed":0,"removed":0}`. A 401 usually means JWT verification is still on (turn off **Verify JWT with legacy secret**, or deploy with `--no-verify-jwt`), a 404 means the URL in Vault is wrong or the function isn't deployed, and a 500 includes the error. No rows at all means the schedule isn't running or a Vault secret is missing. **After the trip:** `select cron.unschedule('krysa-notify');`.

## Deploying to GitHub Pages

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions:** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Without them the site publishes the demo.
3. Push to `main`. [`deploy.yml`](.github/workflows/deploy.yml) type-checks, runs the tests, builds and publishes.

The build uses a relative base, so it works under `https://<user>.github.io/<repo>/`.

## How it's put together

```
src/
  main.ts            picks demo or Supabase mode, sign-in gate, service worker
  lib/               pure, strictly typed and unit tested
    dates.ts         wall-clock helpers (Prague = Amsterdam time zone)
    money.ts         balances and settle-up in haléře, CZK/EUR
    schedule.ts      now & next, leave-by times, check-in rules, reminders
    geo.ts           walking-time estimates from where you stay
    demo.ts          keeps the demo trip "on" by moving its dates
    notify.ts        which reminders and posts to push, and to whom
    webpush.ts       Web Push on WebCrypto: VAPID signing and payload encryption (RFC 8291/8292)
  data/
    runtime.ts       the data interface the UI uses, plus the in-memory Store
    local.ts         demo backend (localStorage)
    supabase.ts      Supabase backend: optimistic writes, Realtime, offline cache, signed upload URLs
  art/
    rat.ts           Krysa and all the outfits, faces and colourings (SVG)
    scenes.ts        the illustrated Prague scenes behind each tab
    meme.ts, model.ts  the meme maker's options and rendering
    export.ts        meme → PNG on a canvas
  ui/                tabs, sheets, Rat Wall, idle rats, Rat Wrapped, reminders, notifications switch, accessibility
supabase/            schema, demo seed
  functions/krysa-notify/  the Edge Function that sends push notifications (Deno; logic in handler.ts)
public/              manifest, service worker (offline shell and notifications), icons
```

The data layer mirrors the claude.ai artifact runtime the app started life on (`runtime.use("db")`, `doc().set()`, `collection().onSnapshot()`…), so the UI didn't have to change when the storage moved to Supabase. Another backend can be added by implementing `Runtime` in `src/data/`.

## Security notes

- **The site is public, the data isn't.** GitHub Pages serves the app to anyone, but every read and write goes through row level security and requires a device that entered the trip code. Requests without a session can't even see the `krysa` schema, and visitors who never type a code create nothing in Supabase.
- **The trip code is the only key.** Anyone who has it gets full access, so share it only in your group chat. Codes are stored as SHA-256 hashes, and each device gets five wrong guesses per hour.
- **The publishable key is public by design.** RLS protects the data. The secret key is only for `pnpm seed` on your own machine.
- **Nothing personal ships with the app.** No codes, emails, names or booking details are built into the bundle; who's an owner lives in the database. A test fails if the demo seed ever contains booking codes.
- **Booking codes:** a booking code plus a surname lets anyone change a booking, so add them in the app only if you're comfortable with every member seeing them. The app masks them until you tap "Show".
- User-generated content is treated as untrusted: the UI builds DOM with `textContent`, and meme options are checked against allow-lists (`normMeme`).
- **Push notifications:** the function only runs for pg_cron's random token, which lives in Vault and never leaves the database. The private key pushes are signed with is created by the function and stored in `krysa.push_keys`, which only the service role and the SQL editor can read. Messages are encrypted for each device, so Apple, Google and Mozilla's push services can't read them. A device's subscription is deleted with its membership.

## Shortcuts and known limits

- **Supabase mode is only tested by hand.** It ran against a real project (a wrong code, joining with the right one, live updates between two browsers, uploading and deleting a Rat Wall post), and the SQL was tested on plain Postgres with stand-ins for Supabase's auth, storage and Realtime publication (the guess limit, deep merge, strangers blocked, delete rules).
- **A device is a member, not a person.** Clearing the browser's data means entering the code again, and posts from the old session can then only be removed by an owner. Anonymous users are never cleaned up automatically; delete old ones under Authentication → Users if you like.
- **No CAPTCHA on anonymous sign-in.** Supabase rate-limits anonymous sign-ins per IP (30 an hour by default) and recommends a CAPTCHA against abuse. Fine for a small group; add Turnstile or hCaptcha before using it more widely.
- **The UI layer is loosely typed.** It was ported from a single-file prototype. `src/ui` and `src/art` type-check with `strict: false`, plus [`loose-dom.d.ts`](src/ui/loose-dom.d.ts). Tighten module by module. `src/lib` and `src/data` are strict.
- **No end-to-end tests.** The logic that can cost money or time (settle-up, reminders, now & next, check-in rules, data merging, the demo date shift) has unit tests. The UI was checked by hand in a browser.
- **Check-in timings are only known for KLM.** Other airlines get a cautious default (reminder from 24 hours before, bag drop closing 45 minutes before). Add airlines in `checkInRule`.
- **Offline is read-only.** The service worker caches the app shell and the last known data. Writes need a connection.
- **Undo is client-side.** A delete can be undone for 8 seconds from the same device. There's no server-side history. An uploaded file is only removed from storage once those 8 seconds are up, so closing or reloading the app sooner leaves the file behind in the bucket (it no longer shows in the app).
- **Uploads use signed URLs that expire after an hour.** The app refreshes them when it re-renders.
- **Notifications are per device, and go to the whole group.** Each phone or browser switches them on by itself, iPhones only from the Home Screen, and every reminder goes to everyone (a flight's check-in too, not only to the people on it). A push that fails to deliver isn't retried, and the function runs every minute until you unschedule it. Delivery was tested against the RFC's example and a stand-in push service, not yet on real phones.
- **One shared trip.** There's no concept of multiple trips or teams.
