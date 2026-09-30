---
name: Krysa
description: The group's departure board for one week in Prague, set in Prague transit wayfinding.
colors:
  # Page tokens. Dark is the default theme; each "-light" key is that token under prefers-color-scheme: light.
  bg: "#131211"
  bg-light: "#f5f4f0"
  surface: "#1b1a18"
  surface-light: "#ffffff"
  surface-2: "#252421"
  surface-2-light: "#eae8e2"
  line: "#2f2d2a"
  line-light: "#dedbd3"
  rule: "#423f3a"
  rule-light: "#c9c5bb"
  ink: "#f1ece2"
  ink-light: "#14171d"
  ink-2: "#aaa69c"
  ink-2-light: "#50576a"
  field-border: "#78746b"
  field-border-light: "#8a8578"
  focus: "#ffb627"
  focus-light: "#14171d"
  # Action
  red: "#d4231c"
  red-light: "#c8102e"
  on-red: "#ffffff"
  red-text: "#ff6f61"
  red-text-light: "#b20d28"
  # Status
  signal: "#ffb627"
  on-signal: "#15171c"
  signal-text: "#ffb627"
  signal-text-light: "#8a5700"
  good: "#44d39a"
  good-light: "#107a4a"
  danger: "#ff7070"
  danger-light: "#b3261e"
  # Fixed in both themes: the departure board (and the toast)
  board: "#0b0a09"
  board-2: "#171614"
  board-line: "#26241f"
  board-ink: "#f4efe4"
  board-dim: "#a3a097"
  amber: "#ffb627"
  board-red: "#ff6f61"
  # Fixed in both themes: the enamel street plate
  plate: "#fbfaf6"
  plate-ink: "#15171c"
  plate-red: "#c8102e"
  # Fixed in both themes: line-badge fills for the plan types, and the ink drawn on them
  kf-work: "#f2b705"
  kf-sight: "#2fbf68"
  kf-food: "#ff8a3d"
  kf-night: "#8b98ff"
  kf-coffee: "#d6a06a"
  kf-travel: "#a9b1c2"
  kf-ink: "#15171c"
typography:
  display:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 70"
  airport-code:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.5rem, 13vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 68"
  headline:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 76"
  sheet-title:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 78"
  title:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.03em"
    fontVariation: "'wdth' 80"
  board-time:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 72"
  stop-time:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 76"
  sign-caps:
    fontFamily: "Archivo, 'Arial Narrow', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.24em"
    fontVariation: "'wdth' 80"
  figure:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.1
    fontFeature: "'tnum'"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.5
    fontFeature: "'tnum'"
  row-title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.3
  button:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.1
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.2
  caps:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.625rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.08em"
  nav:
    fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  booking-code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  xs: "4px"
  sm: "5px"
  md: "8px"
  lg: "14px"
spacing:
  2xs: "4px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  gutter: "16px"
  section: "30px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-red}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.surface-2}"
  button-small:
    typography: "{typography.label}"
    padding: "0 12px"
    height: "36px"
  button-armed:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.bg}"
  icon-button:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    size: "40px"
  add-button:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-red}"
    rounded: "{rounded.sm}"
    padding: "0 18px 0 14px"
    height: "50px"
  field:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "46px"
  field-label:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "36px"
  filter-chip-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
  vote:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    width: "50px"
    height: "54px"
  vote-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
  tag:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.caps}"
    rounded: "{rounded.xs}"
    padding: "4px 6px"
  tag-now:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
  count-badge:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.xs}"
    height: "18px"
  state-open:
    backgroundColor: "{colors.good}"
    textColor: "{colors.bg}"
    rounded: "{rounded.xs}"
    padding: "5px 7px"
  state-air:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.kf-ink}"
    rounded: "{rounded.xs}"
    padding: "5px 7px"
  line-badge:
    textColor: "{colors.kf-ink}"
    rounded: "{rounded.sm}"
    size: "22px"
  line-badge-work:
    backgroundColor: "{colors.kf-work}"
  line-badge-sight:
    backgroundColor: "{colors.kf-sight}"
  line-badge-food:
    backgroundColor: "{colors.kf-food}"
  line-badge-night:
    backgroundColor: "{colors.kf-night}"
  line-badge-coffee:
    backgroundColor: "{colors.kf-coffee}"
  line-badge-travel:
    backgroundColor: "{colors.kf-travel}"
  row:
    padding: "12px 0"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.nav}"
    height: "60px"
  tab-bar-active:
    textColor: "{colors.ink}"
  departure-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.md}"
    padding: "12px 0 4px"
  departure-row:
    padding: "11px 16px"
  departure-time:
    textColor: "{colors.amber}"
    typography: "{typography.board-time}"
  departure-leave-now:
    textColor: "{colors.board-red}"
  board-button:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.sm}"
    height: "36px"
  street-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-ink}"
    typography: "{typography.headline}"
    rounded: "6px"
    padding: "6px 14px"
  bill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 18px 16px"
  ticket:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 18px 18px"
  toast:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  toast-button:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.kf-ink}"
    rounded: "{rounded.xs}"
    padding: "0 14px"
    height: "36px"
---

# Design System: Krysa

## Overview

**Creative North Star: "Odjezdy, the group's departure board"**

Krysa is set like Prague's public-transport wayfinding. The page is the street: warm asphalt at night (the default, dark theme) or worn enamel by day (light). The few objects that carry the important information are the ones a PID stop would have: a white enamel street plate with a red frame naming the tab, a near-black departure board with amber LED times, square line badges in metro and tram colours for the plan types, and a line of stops for the day. Everything else is hairline-ruled rows straight on the page ground. It is dense and quick to scan, read on a phone held in one hand, outdoors in daylight or in a dim bar.

Two voices of type carry it: condensed Archivo caps for anything you glance at (the clock, titles, times, codes) and Manrope for anything you read. There is one action colour, PID red, and one status colour, signal amber. The board and the plates are physical objects: they keep their exact colours whether the phone is light or dark. Motion is signalling, never decoration: a changed time flips like a split-flap, the live dot pulses, a new sky settles into place. Under reduced motion nothing moves.

The build rejects the itinerary-of-cards default: stacked rounded cards under a decorative hero. The illustrated Prague scenes and Krysa the rat are a separate, pinned art layer with their own stylesheet (`src/art/art.css`). The UI frames and sizes the art but never styles inside it. Where the build departed from the direction contract, this file follows the build: panels round to 8px and sheets to 14px (the contract said 4–6px signage corners), heads-up and the Rat Wall's posts are surfaced as well as the three planning objects, and the split-flap and the sky run longer than the 150–250ms state motion.

**Key Characteristics:**
- Dark by default (asphalt), light by preference (enamel), with the same structure in both.
- One action colour (PID red), one status colour (signal amber), six line colours for plan types.
- Hairline rows on the page ground. On the planning tabs only the departure board, the bill and the flight ticket are surfaced.
- Condensed Archivo 800 at widths of 68–80% for signs, Manrope 400–800 for reading, tabular figures everywhere.
- Signage corners, no pills. A circle means a stop on a line.
- Motion that signals: split-flap times, a pulsing live dot, a sky that settles in when it changes. Nothing moves under reduced motion.

## Colors

A night-street palette: warm asphalt neutrals, one enamel-bright action red, one LED amber for status and six transit-line fills. The board and the plates stay fixed across themes.

### Primary
- **PID Red** (`red`, #d4231c dark / #c8102e light) with **White on Red** (`on-red`, #ffffff): the action colour. Used on primary buttons, the floating add button, and the 2px underline of every link and place link. On hover it brightens by 8% (`filter: brightness(1.08)`) instead of switching to a second red. A 35% mix of it tints text selection.
- **Red Text** (`red-text`, #ff6f61 dark / #b20d28 light): the red that passes 4.5:1 as text on the page and on surfaces. Today it colours only the text caret. Use it whenever red has to sit as text.

### Secondary
- **Signal Amber** (`signal`, #ffb627 in both themes) with **Ink on Amber** (`on-signal`, #15171c): status. Used for the "Now" and "Today" tags, the tab bar's count badge, the heads-up mark and its panel (14% into surface, border at 50%, row rules at 30%), the current stop's node with its halo, and a reaction you gave (16% into surface, amber border).
- **Amber as Text** (`signal-text`, #ffb627 dark / #8a5700 light): amber that has to be read on the page, such as first place on the hall of fame.
- **Settled Green** (`good`, #44d39a dark / #107a4a light): settled good news, like "On the plan", "gets back" on the bill and the "Check-in open" state (page colour on green).
- **Error Coral** (`danger`, #ff7070 dark / #b3261e light): errors, invalid fields, destructive quiet buttons, and an armed delete (page colour on danger). It never marks an action you should take.

### Tertiary
Line colours for the plan types, fixed across themes and drawn as square badge fills with the icon in **Line Ink** (`kf-ink`, #15171c):
- **Metro B Yellow** (`kf-work`, #f2b705): work.
- **Metro A Green** (`kf-sight`, #2fbf68): sights.
- **Tram Orange** (`kf-food`, #ff8a3d): food.
- **Night Tram Violet** (`kf-night`, #8b98ff): nights out.
- **Kavárna Tan** (`kf-coffee`, #d6a06a): coffee.
- **Airport Steel** (`kf-travel`, #a9b1c2): travel.

### Neutral
- **Asphalt Night / Worn Enamel** (`bg`, #131211 / #f5f4f0): the page ground. Rows sit directly on it.
- **Tarmac / Enamel White** (`surface`, #1b1a18 / #ffffff): surfaced objects, the tab bar, sheets and default buttons.
- **Raised Tarmac / Station Tile** (`surface-2`, #252421 / #eae8e2): fields, tags, votes, reactions, media wells and quiet-button hover.
- **Hairline** (`line`, #2f2d2a / #dedbd3): row rules, panel borders and the tab bar's edge.
- **Rule** (`rule`, #423f3a / #c9c5bb): control borders, the line joining stops and stations, dashed tear lines and the sheet grabber.
- **Chalk / Timetable Black** (`ink`, #f1ece2 / #14171d): text, and the ground of every pressed control.
- **Faded Timetable** (`ink-2`, #aaa69c / #50576a): meta, labels, hints, placeholders and anything that is over.
- **Field Edge** (`field-border`, #78746b / #8a8578): input borders, at 3:1 on surface and surface-2.
- **Focus** (`focus`, amber #ffb627 in dark / ink #14171d in light): the 2px focus ring at a 2px offset. On the board it is always amber.

### Fixed objects (both themes)
- **Board Black** (`board` #0b0a09, `board-2` #171614, `board-line` #26241f): the departure board's ground, its buttons and its rules. The toast uses the same ground.
- **LED Amber** (`amber`, #ffb627), **Board Chalk** (`board-ink`, #f4efe4), **Board Dim** (`board-dim`, #a3a097): board times and heading, titles, and secondary text.
- **Leave-now Red** (`board-red`, #ff6f61): "Leave now" and the line under it. This is the only red status in the system.
- **Plate Enamel** (`plate`, #fbfaf6), **Plate Ink** (`plate-ink`, #15171c), **Plate Frame Red** (`plate-red`, #c8102e): the street plate's enamel, lettering, frame and Czech name.

### Named Rules
**The Red Means Go Rule.** On the page, red only goes on things you press or follow: primary buttons, the add button, link underlines. Status, counts, selection and "today" are never red. Two reds are not actions, and each belongs to its object: the board's "Leave now" (`board-red`) and the plate's enamel frame (`plate-red`).

**The Amber Is Now Rule.** Status is amber or ink. Amber marks what is happening or needs you now. Ink marks where you are: today's station, the active tab, a pressed control. Green is only for settled good news.

**The Fixed Objects Rule.** The departure board, the toast (a strip of the board), the enamel plates and the line-badge fills keep one set of values in both themes. Only the page around them re-themes. On the board, amber does the job red does on the page, so the board's link underlines and the toast's button are amber.

**The Tested Pair Rule.** Every text and UI pair is listed in `tests/contrast.test.ts` and passes in both themes: 4.5:1 for text, 3:1 for control boundaries and focus. Add a new pairing to the test before it ships. Tested today: ink on bg, surface, surface-2 and both amber tints; ink-2 on bg, surface, surface-2 and the heads-up tint; red-text, signal-text and good on bg and surface; danger on bg, surface and surface-2; on-red on red; on-signal on signal; board-ink and board-dim on board and board-2; amber and board-red on board; plate-ink and plate-red on plate; kf-ink on every line fill and on amber; bg on ink, good and danger. Boundaries: field-border on surface and surface-2, red and focus on bg and surface, amber on board.

## Typography

**Display Font:** Archivo (with Arial Narrow, sans-serif). One weight, 800, with a working width axis from 62% to 125%.
**Body Font:** Manrope (with ui-sans-serif, system-ui, Segoe UI, sans-serif). Variable, 400–800.
**Label/Mono Font:** the platform monospace (ui-monospace, SF Mono, Menlo, Consolas), used only for booking codes.

**Character:** Condensed Archivo caps are the lettering of the stop sign and the departure board: tall, tight and readable from a distance. Manrope is a warm, open grotesque for sentences and amounts. Both are self-hosted. The body sets tabular figures (`tnum`) for the whole app, so a ticking time or a column of koruna never jitters.

### Hierarchy
- **Display** (Archivo 800, 3.5rem, 4.5rem from 700px, line-height 0.88, width 70%): the clock on Today, over the sky.
- **Airport code** (Archivo 800, clamp(2.5rem, 13vw, 3.5rem), 0.9, width 68%): IATA codes at each end of a ticket.
- **Headline** (Archivo 800, 1.625rem, 2rem from 700px, 2.25rem at sign-in, line-height 1, width 76%, uppercase, +0.02em): the tab's name on its street plate.
- **Sheet title** (Archivo 800, 1.375rem, 1.1, width 78%, uppercase, +0.02em): the heading of every sheet.
- **Title** (Archivo 800, 1.1875rem, 1.1, width 80%, uppercase, +0.03em): section heads ("Today's line", "The bill") and day heads. The board's own head is 1.0625rem at +0.06em, in LED amber.
- **Board time** (Archivo 800, 1.375rem, 1, width 72%): departure times. The lead departure's time is 1.75rem. Flight numbers use 1.5rem at width 76%.
- **Stop time** (Archivo 800, 1.0625rem, 1.1, width 76%): times on a line of stops. Day numbers, vote counts, podium places and expense dates use the same face at width 80%.
- **Sign caps** (Archivo 800, 0.75rem, 1, width 80%, uppercase, +0.24em): the Czech second language of a sign, "Odjezdy" on the board. On the bill, "Účet" is 0.875rem at +0.34em.
- **Figure** (Manrope 800, 1.5rem, 1.1): the bill's total. The converter's result is 1.625rem.
- **Body** (Manrope 500, 0.9375rem, 1.5, tabular): everything you read. Empty-state notes stop at 42ch.
- **Row title** (Manrope 700, 1rem, 1.3): a stop's title (an idea's title is 800). Plain row titles are body size at 700.
- **Button** (Manrope 700, 0.9375rem, 1.1): button labels. The add button is 800.
- **Label** (Manrope 700, 0.8125rem, 1.2): field labels, small buttons and filters. Meta lines and hints are the same size at 500 in ink-2.
- **Caps** (Manrope 800, 0.625rem, 1, uppercase, +0.08em): tags, vote labels and weekday names. Flight states and ticket fact labels are 0.6875rem.
- **Nav** (Manrope 700, 0.6875rem, 1, +0.02em): the tab bar's names.
- **Booking code** (monospace 700, 0.9375rem, +0.08em): booking codes, masked until asked for.

### Named Rules
**The Sign and Reading Rule.** Archivo is for things you glance at: the clock, plate titles, section and sheet heads, departure and stop times, flight numbers and airport codes, day numbers and vote counts. Manrope is for things you read, amounts included. Never set a sentence in Archivo.

**The Width, Not Weight Rule.** Archivo exists only at 800, so hierarchy in the sign layer comes from size and width, never from a lighter cut. Widths run from 68% for the biggest codes to 80% for section heads, set with `font-stretch`.

**The Art Faces Stay in the Art Rule.** Anton, Comic Neue and Cinzel are loaded for memes and scene art only. No UI surface uses them.

## Layout

Single column, phone first. Content sits in a 640px column with 16px gutters. Sections in `main` are 30px apart. A section's head, hint and list are 10px apart, and rows have 12px above and below. Gaps are 6px between buttons and chips, 8px between action pairs and 10px inside grids and panels.

Every tab opens under the band, a Prague scene 128px tall plus the safe area. On Today the band is 212px. From 700px the band is 150px, or 260px on Today. The scene is capped at 960px wide and fades at its edges from 980px. The tab's plate sits bottom left. On Today the clock sits there instead, with a sub-line on a dark strip (rgb(10 11 15 / .62)) so it reads over any part of the art, and Krysa stands on the ground at the right. The band sets its own text colour per scene (light text on dark scenes, dark text on light scenes), because it reads over art, not over the page.

The tab bar is docked at the bottom: 60px plus the safe-area inset, five equal columns. From 900px it becomes a 92px side rail with 78px rows, and the page moves 92px to the right. Below 320px only the icons show, and the names stay for screen readers. The add button floats bottom right above the tab bar, 16px in (from 700px it aligns to the 640px column), and moves into the rail from 900px. It steps aside while a field on the page has focus. Sheets rise full width from the bottom (560px max) and are centred from 640px. Breakpoints: 320, 360 (the converter stacks), 640, 700, 900 and 980px.

**The Thumb Column Rule.** Everything you act on is within a thumb's reach: the tab bar at the bottom, the add button bottom right, a sheet's action bar stuck to its bottom edge. Every control has a hit area of at least 44 × 44px. Small controls keep their look and extend the hit area with an invisible `::before`.

## Elevation & Depth

The page is flat and a few objects are lifted. Depth is mostly tonal: page ground, then surface, then surface-2, separated by hairlines rather than shadows. A shadow means an object sits above the page (the board, an overlay) or is a physical thing hung over the art (the plate, the add button).

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 10px 28px rgb(0 0 0 / .45)` dark, `0 8px 22px rgb(20 23 29 / .14)` light, as `--shadow`): the departure board, sheets, the toast and the sign-in card.
- **Add button** (`box-shadow: 0 8px 22px rgb(0 0 0 / .38)`): the floating add button only.
- **Plate** (`box-shadow: inset 0 0 0 2px var(--plate), inset 0 0 0 3.5px var(--plate-red), 0 6px 16px rgb(0 0 0 / .3)`): the plate's thin inner red line and the way it hangs off the scene.
- **Now halo** (`box-shadow: 0 0 0 4px` signal at 32%): the node of the stop that is on now.
- **Clock glow** (`text-shadow: 0 2px 18px rgb(0 0 0 / .35)`): the clock over dark scenes. Light scenes drop it.

### Named Rules
**The Hairline Default Rule.** A list is rows ruled with 1px `line` on the page ground: no card, no shadow, no fill. On the planning tabs only three objects are surfaced: the departure board, the bill (účet) and the flight ticket. Heads-up is one amber-tinted panel. The Rat Wall frames its posts and hall of fame because they hold media.

**The Board Lifts Rule.** Of the surfaced objects only the departure board carries the lift. The bill and the ticket are flat paper: surface fill and a 1px hairline border. Everything else that lifts is an overlay.

## Shapes

The shapes follow transit signage. Corners are 4px on tags, counts, states, codes, the band's sub-line strip and the toast button. They are 5px on buttons, fields, icon buttons, line badges, the segmented control (its inner buttons are 3px), filters, reactions, votes, the toast and the add button. Panels are 8px: the board, heads-up, the bill, tickets, posts, thumbnails and the drop zone. Sheets and the sign-in card are 14px; on phones a sheet rounds only its top corners. The street plate is 6px, with a 3px red border and a thin red line inside it.

Circles appear only where a transit map would draw them: stop nodes (14px, 3px ring), station day numbers (32px, 2px ring), the live dot (8px) and the item dots under a station (5px). A 2px `rule` line joins stops vertically and stations horizontally.

**The Signage Corner Rule.** Controls get 4–5px corners, panels 8px, sheets 14px. Nothing is a pill and no button is fully round. A circle means a stop on a line.

**The Dashed Line Rule.** A dashed line means paper, or not yet. Paper: the bill's tear lines, the ticket's perforation and its flight path. Not yet: a suggested stop (dashed node, dashed underline), the suggestions banner, the upload drop zone. Anything settled gets a solid hairline.

## Components

### Buttons
Plain and firm, like signage: 5px corners, Manrope 700, 44px tall.
- **Shape:** gently squared (5px).
- **Primary:** PID red fill and border with white text, 0 16px padding. Hover brightens by 8%. On press it moves 1px down.
- **Default:** surface fill, 1px rule border, ink text. Hover turns the border ink-2.
- **Quiet:** transparent, filling with surface-2 on hover. A destructive quiet button uses danger text. An armed delete ("tap again") fills with danger and page-colour text.
- **Small:** 36px tall, 0 12px padding, label type. The hit area stays 44px.
- **Icon buttons:** 40px (36px boxed, with a rule border), ink-2 turning ink on a surface-2 hover. A boxed toggle inverts to ink when pressed.
- **Add button:** floating, 50px tall, PID red with an 800-weight label and a 20px plus icon, with its own shadow. In the side rail it becomes a 72px-wide stacked tile.
- **On the board:** board-2 fill, board-line border, board-ink text.
- **Hover / Focus:** background, border and colour change over 0.15s. Focus is the global 2px ring at a 2px offset. Disabled drops to 50% opacity.

### Links
Ink text at 800 with a 2px PID red underline, 3px offset. On hover the underline takes the text colour. On the board the underline is amber. A row's title is a button whose `::after` covers the row, and hovering it underlines the title in red.

### Chips
- **Filters:** 36px, surface fill, rule border, label type, led by a 20px line badge, with the count in ink-2. Pressed inverts to ink with page-colour text.
- **Segmented control:** a 3px tray on surface with a rule border, 40px buttons in ink-2. Pressed inverts to ink.
- **Vote:** a 50 × 54px tally on surface-2 with a rule border, the count in Archivo at width 80% over a caps label. Pressed inverts to ink.
- **Reactions:** 36px, surface-2 fill, hairline border, a 24px drawn rat face and a count. A reaction you gave is amber-tinted with an amber border.
- **Meme maker chips:** text chips like filters. Thumbnail and swatch chips have a 2px border that turns ink when chosen.

**The Ink Invert Rule.** A pressed or selected control inverts to an ink ground with page-colour text: segmented buttons, filters, votes, chips, boxed toggles, today's station. It is never red and never amber. The one amber selection is a reaction you gave, because that is status.

### Tags and states
- **Tag:** caps type, 4px × 6px padding, 4px corners, surface-2 fill, ink-2 text. "Now" and "Today" are amber with ink.
- **Count badge:** 18px, amber with ink, 4px corners, at the top right of a tab's icon.
- **Flight state:** caps at 0.6875rem, 5px × 7px padding. "Check-in open" is page colour on green, "In the air" is line ink on amber, and the rest are ink-2 on surface-2.

### Rows
- **Style:** 12px above and below, a 1px line rule between rows, and the list closed by a line above and below. Title at 700, meta at 0.8125rem in ink-2, amounts at 800 aligned right with the other currency in ink-2 under them.
- **Leads:** expense rows start with the date in Archivo caps, flight rows with the flight number, idea rows with the vote tally.
- **To-dos:** a 22px checkbox in ink. A done item is struck through and steps back to ink-2.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** surface. The departure board is board black.
- **Shadow Strategy:** only the board lifts (see Elevation & Depth).
- **Border:** 1px line on the bill, the ticket, posts and the hall of fame. Heads-up uses amber at 50%.
- **Internal Padding:** bill 14px 18px 16px, ticket 14px 16px, hall of fame 14px 16px 16px, post footer 10px 12px.

### Inputs / Fields
- **Style:** at least 46px tall, surface-2 fill, 1px field-border, 5px corners, 10px × 12px padding. Text is never under 16px, so iOS doesn't zoom. The label sits above in label type and ink-2, 6px away. Placeholders are ink-2 and the caret is red-text.
- **Focus:** the border turns ink, and the global focus ring shows too.
- **Error / Disabled:** a danger border with a 1px danger ring, and the message below in danger at 700, 0.875rem.
- **Selects and choices:** selects draw their own chevron. Textareas start at 88px and resize vertically. Checkboxes are 20–22px with an ink accent.

### Navigation
- **Tab bar:** surface with a 1px line edge. Each tab is a 24px drawn icon over its name in nav type. Tabs are ink-2 at rest and ink on hover or when current. The current tab carries a 3px ink bar on its outer edge: the top on phones, the left in the rail. Counts use the amber badge.
- **Station strip (Week):** sticky on the page ground with a hairline below. Days are 32px circles on a 2px rule line, with the weekday in caps above and up to four 5px item dots below. Today inverts to ink and past days turn ink-2.

### Icons
One drawn set: a 24px grid, 1.8 stroke, round caps and joins, `currentColor`, no fills apart from the odd dot. They are 24px in the tab bar, 20px in icon buttons and the add button, 18px in buttons, 16px in small buttons and 15px (stroke 2.1) inside line badges.

### The departure board
The signature object. Board black, 8px corners, the lift shadow, identical in both themes. The head shows "Next up" in amber title caps and "Odjezdy" in board-dim sign caps, over a board-line rule. What's on now sits in the head, led by a pulsing 8px live dot. Rows are a grid of 64px time, 22px line badge, title and status, ruled in board-line, with times in amber Archivo at width 72%. The lead row gets a 1.75rem time, a 1.125rem title at 800, a "Leave in …" status in amber, and the leave-by and place lines under it. When the leave-by time arrives, the status and its line turn Leave-now red and pulse (1.6s). A changed status flips like a split-flap (0.38s). It starts half-turned but readable, so nothing ever blinks out. When nothing is left, a board-dim sentence sits above board buttons.

### The enamel street plate
Plate enamel with plate-ink lettering, a 3px plate-red border, 6px corners and a thin inner red line. The tab name is the Archivo headline in uppercase at width 76%, with its Czech name below in plate-red caps (0.625rem, +0.16em). It sits at the band's bottom left. On the sign-in card it overlaps the card's top edge.

### Line badges
A 22px square (20px in filters) with 5px corners, filled with the plan type's line colour and carrying its icon in line ink. Each is named for screen readers. Once the stop is over, the badge turns greyscale.

### A line of stops
A grid of 48px time, 18px node and content, with a 2px rule line running through the nodes. A node is a 14px ring of 3px ink on the page ground. **Now:** a filled amber node with a 4px halo at 32%, plus the "Now" tag. **Past:** text in ink-2, a rule-filled node, a greyscale badge and rule-coloured underlines. It steps back in colour, not opacity. **Suggested:** a dashed node and a dashed underline.

### The bill (účet)
A surface panel with 8px corners and a hairline border. The Czech header "Účet" is centred in sign caps over a dashed rule. There is one line per transfer ("Alex pays Jules"), with dashed separators and the amount at 800 on the right, the euro value in ink-2 under it. The total sits under a 3px double ink rule in figure type. Balances follow a dashed rule: "gets back" in green, "owes" in ink.

### The flight ticket
A surface panel with 8px corners, a hairline border and 14px × 16px padding. The head holds the flight number (Archivo 1.5rem), the date and the state. On the route, the airport codes stand at either end in the airport-code face, with the time (Manrope 800) and the city under each. Between them runs a 2px dashed flight path, with the plane placed by the flight's progress and the duration below. Facts sit under a dashed perforation, with labels in caps. Booking codes show as masked dots in the booking-code face on surface-2, with quiet Show and Copy buttons. The ticket's links are "Check in" (small primary) and "Flight status" (small default).

### Heads-up
One panel: amber at 14% into surface, a 50% amber border and rows ruled at 30%. Each row has a 22px amber mark with the alert icon, the text at 600 with a link after it, and a dismiss icon button.

### Sheets and toasts
- **Sheet:** a modal dialog on a rgb(5 6 9 / .6) scrim. Surface fill, 14px corners, a 40 × 4px rule grabber on phones, 14px between blocks, 18px sides (24px when centred), headed by a sheet title. Its action bar sticks to the bottom behind a hairline. It slides up over 0.22s (`cubic-bezier(.2,.8,.2,1)`).
- **Toast:** a strip of departure board: board black and board-ink, 5px corners, the lift shadow. Its action is an amber button with line-ink text.

### Empty states
Krysa (56px) stands beside a one-line ink-2 note (42ch max) and the one action that fills the list, usually a primary button. While loading, surface blocks shimmer with surface-2 over 1.4s, and stay still under reduced motion.

## Do's and Don'ts

### Do:
- **Do** keep PID red (`red`) for things you press or follow: primary buttons, the add button and link underlines (2px, 3px offset).
- **Do** mark status with signal amber (`signal` fill with `on-signal`, `signal-text` as text) or with ink.
- **Do** rule lists with 1px `line` hairlines directly on the page ground, with 12px above and below each row.
- **Do** set signs, times and codes in Archivo 800 condensed with `font-stretch` (68–80%), and everything you read in Manrope with tabular figures.
- **Do** keep the departure board, the toast, the plates and the line-badge fills at their fixed values in both themes.
- **Do** step past items back with `ink-2` and greyscale badges, not with opacity.
- **Do** invert pressed and selected controls to an ink ground with page-colour text.
- **Do** add every new text or boundary pair to `tests/contrast.test.ts` (4.5:1 text, 3:1 boundaries) for both themes.
- **Do** give every control a 44 × 44px hit area and every field at least 16px text.
- **Do** keep motion to signalling (0.15–0.25s ease-out for state, 0.38s for the split-flap, 0.45s for a new sky scaling in from 104%) and stop all of it under reduced motion.

### Don't:
- **Don't** build the itinerary-of-cards default: stacked rounded cards under a decorative hero.
- **Don't** use red for status, counts, selection or "today". The only red status is the board's "Leave now" in `board-red`.
- **Don't** wrap planning rows in cards or give the bill and the ticket a shadow. Only the board and overlays lift; the add button and the plates have their own shadows.
- **Don't** round anything into a pill or past 14px. Circles are only for stops, stations and the live dot.
- **Don't** set sentences in Archivo or fake a lighter Archivo. It ships at 800 only.
- **Don't** use Anton, Comic Neue or Cinzel outside the meme maker and the scene art, and don't style inside the art from the app stylesheet.
- **Don't** re-theme the departure board or the plates for light mode.
- **Don't** load fonts or assets from third parties. Every face is self-hosted.
