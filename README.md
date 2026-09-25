# Krysa · Prague Week

A rat-themed team planner for a conference week in Prague: the Rat Wall with a Krysa meme maker, flights, a day-by-day plan with "Now & next", ideas with voting, to-dos, a koruna/euro expense splitter and trip info. It installs on phones as a PWA.

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
| `pnpm preview` | Serve the build locally (service worker active) |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm typecheck` | Strict check of `src/lib`, `src/data` and tests, loose check of the UI |
| `pnpm seed [file]` | Load a seed file into Supabase (reads `.env`). Without a file it loads the demo trip |

## Setting up Supabase

Krysa keeps everything in its own Postgres schema (`krysa`) and storage bucket (`krysa-uploads`). Supabase has no folders, so the schema is the "subfolder": the app can live in a personal project next to other things, or in a project of its own.

1. Pick a project at [supabase.com](https://supabase.com), or create one.
2. In the **SQL editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates, all inside `krysa`:
   - `docs`: every document as JSON under a path like `events/abc123`, kept live with Realtime
   - `members`: the emails that are allowed in, and who's an owner
   - `profiles`: display names
   - the private `krysa-uploads` bucket (20 MB per file)
   - row level security so only members can read or write, and only the poster or an owner can remove a Rat Wall post
3. **Project Settings → API → Exposed schemas** (Data API settings): add `krysa`. Without this the app gets "permission denied" errors. See [Using custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas).
4. Let people in. Add them to the member list:
   ```sql
   insert into krysa.members (email, is_owner) values ('you@example.com', true), ('friend@example.com', false);
   ```
   Then invite the same addresses under **Authentication → Users → Invite user**. The sign-in form never creates accounts, so visitors of the public site can't sign up to your project.
5. **Authentication → URL configuration:** add your GitHub Pages URL and `http://localhost:5173` to the Redirect URLs. If the project is shared with other apps, leave the Site URL as it is.
6. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (**Project Settings → API keys**; a legacy anon key also works as `VITE_SUPABASE_ANON_KEY`).
7. Optionally load data: add `SUPABASE_SECRET_KEY` to `.env`, then run `pnpm seed` for the demo trip or `pnpm seed my-trip.private.json` for your own. Files ending in `.private.json` are ignored by git. Re-running only adds missing documents. Never commit or deploy the secret key.

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
  data/
    runtime.ts       the data interface the UI uses, plus the in-memory Store
    local.ts         demo backend (localStorage)
    supabase.ts      Supabase backend: optimistic writes, Realtime, offline cache, signed upload URLs
  art/
    rat.ts           Krysa and all the outfits, faces and colourings (SVG)
    scenes.ts        the illustrated Prague scenes behind each tab
    meme.ts, model.ts  the meme maker's options and rendering
    export.ts        meme → PNG on a canvas
  ui/                tabs, sheets, Rat Wall, idle rats, Rat Wrapped, reminders, accessibility
supabase/            schema, demo seed
public/              manifest, service worker, icons
```

The data layer mirrors the claude.ai artifact runtime the app started life on (`runtime.use("db")`, `doc().set()`, `collection().onSnapshot()`…), so the UI didn't have to change when the storage moved to Supabase. Another backend can be added by implementing `Runtime` in `src/data/`.

## Security notes

- **The site is public, the data isn't.** GitHub Pages serves the app to anyone, but every read and write goes through row level security and requires a signed-in member. Anonymous requests can't even see the `krysa` schema.
- **The publishable key is public by design.** RLS protects the data. The secret key is only for `pnpm seed` on your own machine.
- **Nothing personal ships with the app.** No emails, names or booking details are built into the bundle; who's an owner lives in the database. A test fails if the demo seed ever contains booking codes.
- **Booking codes:** a booking code plus a surname lets anyone change a booking, so add them in the app only if you're comfortable with every member seeing them. The app masks them until you tap "Show".
- User-generated content is treated as untrusted: the UI builds DOM with `textContent`, and meme options are checked against allow-lists (`normMeme`).

## Shortcuts and known limits

- **Supabase mode hasn't run against a real project yet.** The SQL was tested on plain Postgres with stand-ins for Supabase's auth, storage and Realtime publication (member access, deep merge, strangers and anonymous users blocked, delete rules). Expect small fixes on first connect.
- **The UI layer is loosely typed.** It was ported from a single-file prototype. `src/ui` and `src/art` type-check with `strict: false`, plus [`loose-dom.d.ts`](src/ui/loose-dom.d.ts). Tighten module by module. `src/lib` and `src/data` are strict.
- **No end-to-end tests.** The logic that can cost money or time (settle-up, reminders, now & next, check-in rules, data merging, the demo date shift) has unit tests. The UI was checked by hand in a browser.
- **Check-in timings are only known for KLM.** Other airlines get a cautious default (reminder from 24 hours before, bag drop closing 45 minutes before). Add airlines in `checkInRule`.
- **Offline is read-only.** The service worker caches the app shell and the last known data. Writes need a connection.
- **Undo is client-side.** A delete can be undone for 8 seconds from the same device. There's no server-side history.
- **Uploads use signed URLs that expire after an hour.** The app refreshes them when it re-renders.
- **One shared trip.** There's no concept of multiple trips or teams.
