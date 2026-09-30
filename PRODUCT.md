# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A handful of Hypersolid colleagues travelling together to the FrontKon frontend conference in Prague (4–10 Oct 2026). They are design-literate frontend developers. During the week they use Krysa on their phones while walking, on trams, at the conference and in bars. Before the trip they use it to plan together: bookings, ideas, flights. Most of them add it to the Home Screen as a PWA.

## Product Purpose

One shared place for the week that answers, first, what's next, when to leave and how far it is. Around that sit the day-by-day plan, ideas the group votes on, flights with check-in timing, to-dos, shared costs split in koruna and euro, and the trip basics. The Rat Wall, a meme wall with a Krysa meme maker, keeps it fun. Success: nobody has to scroll the group chat to find out where to be, and the costs are settled when the week ends.

## Positioning

It knows this one week: walking times from the apartment, leave-by times, KLM's check-in rules, the koruna rate, the way to FrontKon (metro B). Krysa, the house rat, is its mascot. A general trip planner knows none of that.

## Operating Context

- Phones first, one-handed, outdoors in daylight and in dim bars at night. Desktop is secondary.
- Everyone joins with a shared trip code; there are no accounts. Each device picks a first name.
- Reads work offline from the last saved copy; changes need a connection.
- Push notifications (opt-in per device) mirror the reminders the app shows: check-in, leaving for the airport, the next plan item, due to-dos, new rats.
- Demo mode (`pnpm dev:demo`) runs a made-up trip that is always on day 2.

## Capabilities and Constraints

- Vanilla TypeScript and Vite, no UI framework; minimal dependencies (supabase-js only); pnpm.
- Data: Supabase (Postgres documents, Realtime, Storage) or the local demo store, behind one runtime interface.
- Hosted on GitHub Pages; pushing to `main` deploys.
- Proof of concept for one trip and one group: see the README's shortcuts and known limits.
- Removed on 2026-09-30 to keep the app simple: Rat TV, Rat Wrapped, sneaky rats and the rat-catcher scoreboard, rat facts and the sleeping mascot.

## Brand Commitments

- Krysa the rat (all outfits, faces and colourings in `src/art/rat.ts`) and the illustrated Prague scenes (`src/art/scenes.ts`) stay.
- The Rat Wall is the fun part and keeps its character; the full meme maker stays with every option.
- English UI with a little Czech on the side (day names, a greeting).

## Evidence on Hand

- `supabase/seed/demo.json`: a made-up demo trip (invented people, flights, costs and posts; the venues are real public places).
- The real trip data lives only in Supabase and in private files outside the repo. Never commit it or show it in the demo.

## Product Principles

1. Now first: the next thing, when to leave and how far always come before anything else.
2. One home: Today changes with the trip (before, during, after) instead of the start screen moving.
3. Fun has a place: the Rat Wall is loud; the planning screens stay calm and quick to scan.
4. Everything within a thumb: one-handed on a phone, big targets, no hunting through menus.
5. Private by default: booking codes stay masked, nothing loads from third parties.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast checked in both themes by `tests/contrast.test.ts`, 44 px tap targets, full keyboard use, focus kept across re-renders, screen-reader labels, reduced motion respected, no iOS zoom on fields (16 px inputs), text sizes in rem.
