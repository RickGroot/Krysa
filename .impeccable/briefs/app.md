# Surface brief: the Krysa app (all tabs)

Scope: the whole app shell and its five tabs (Today, Week, Rats, Money, Trip), the sign-in gate, sheets and dialogs. Mode: Operate (the Rat Wall leans Experience inside the same world).

Audience and job: colleagues on phones during the Prague week. They need to know what's next, when to leave and how far; add or change plans; vote on ideas; post rats; log and settle costs; find flights, the stay and to-dos.

Confirmed by Rick (2026-09-30): direction "Odjezdy". Today is always home. Keep the full meme maker; remove Rat TV, Rat Wrapped, sneaky rats and the scoreboard, rat facts and the sleeping mascot. Ship before the trip only if solid, from the branch `redesign/odjezdy`.

Memorable moment: the departure board on Today, the next plan item with a live "leave in" count, under a sky that follows Prague's clock.

## Direction contract

THESIS: Krysa is the group's departure board for the Prague week. It answers "what's next, when do we leave, how far" the way a PID stop does. It refuses the itinerary-of-cards default: stacked rounded cards under a decorative hero.

OWN-WORLD: Prague transit wayfinding. White-enamel street plates with a red frame for page titles. A near-black departure board with amber LED times. Asphalt-night grounds in dark, enamel-white in light. PID red as the one action colour. Metro and tram line colours as the plan-type system (square line badges with drawn icons). Condensed Archivo caps for signs and times, Manrope for reading. Hairline-ruled rows instead of cards, signage corners (4–6 px), no pills.

STORY: open the app, see the next departure and when to leave, glance at today's line of stops, act (Route, Map, Check in, tick a to-do), then drop into the Week, the Rat Wall or the bill.

FIRST VIEWPORT (Today, phone): a sky band about 200 px tall with the scene for the time of day (morning, afternoon, dusk or night), the big clock, the day ("Day 3 of 7") and Krysa on the ground at the right. Below: heads-up rows, then the departure board: the next item with time, line badge, title, place, a live "leave in" count and Route and Map, then the two after it. Below that, today's line of stops. The tab bar is docked at the bottom; the primary add sits bottom right.

FORM: Prague transit signage (PID stops, departure boards, enamel street plates), first on the ordered list. Seed key: none; `concept-seed` isn't installed here, so the directions were derived by hand and chosen through the question tool. Signature interaction: the board ticks every minute. A changed time flips like a split-flap, and when the leave-by time arrives the row turns to "Leave now" in red. Motion grammar: 150–250 ms ease-out, a flip for changing times, a cross-fade for the sky, sheets sliding up. Nothing moves under reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
