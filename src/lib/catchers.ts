/**
 * The rat-catching scoreboard. Scores are kept per device (each phone or
 * browser signs in on its own), so someone using a phone and a laptop would
 * show up twice. Devices whose display names match, ignoring case and extra
 * spaces, count as one catcher. Devices without a name yet stay on their own.
 */
export interface Catcher {
  /** The devices counted in this row. */
  ids: string[];
  /** As the first of those devices spells it; empty while none has a name. */
  name: string;
  n: number;
}

const sameName = (name: string): string => name.normalize("NFC").replace(/\s+/g, " ").toLowerCase();

/** Scoreboard rows, most catches first. `profiles`: the display name of each device. */
export function catchers(scores: unknown, profiles: Readonly<Record<string, { name?: string } | undefined>>): Catcher[] {
  const rows = new Map<string, Catcher>();
  if (scores && typeof scores === "object") {
    for (const [id, n] of Object.entries(scores)) {
      if (typeof n !== "number" || !(n > 0)) continue;
      const name = (profiles[id]?.name ?? "").trim();
      const key = name ? `name:${sameName(name)}` : `id:${id}`;
      const row = rows.get(key);
      if (row) {
        row.ids.push(id);
        row.n += n;
      } else rows.set(key, { ids: [id], name, n });
    }
  }
  return [...rows.values()].sort((a, b) => b.n - a.n);
}
