/**
 * Shared-cost maths. Everything is settled in Czech koruna; euro amounts are
 * converted with the trip's exchange rate. Amounts are handled in haléře
 * (1/100 Kč) internally so rounding never leaves a few crowns unaccounted for.
 */
export const DEFAULT_RATE = 24.3;

export interface Expense {
  what?: string;
  amount: number | string;
  currency?: string;
  paidBy?: string;
  split?: string[];
  date?: string;
}

export interface Person {
  id: string;
  name?: string;
}

export interface Transfer {
  from: string;
  to: string;
  /** Koruna. */
  amt: number;
}

export function rateOf(info?: { eurCzk?: number | string } | null): number {
  const r = Number(info?.eurCzk);
  return r > 1 && r < 100 ? r : DEFAULT_RATE;
}

/** The expense in koruna (float, not rounded). */
export function toCzk(e: Expense, rate: number): number {
  const amount = Number(e.amount) || 0;
  return amount * (e.currency === "EUR" ? rate : 1);
}

/** "1 250 Kč": the amount never breaks from its unit. */
export function fmtCzk(n: number): string {
  return `${Math.round(n).toLocaleString("cs-CZ")}\u00a0Kč`;
}

export function fmtEur(n: number): string {
  return `€${n.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtAmt(e: Expense): string {
  return e.currency === "EUR" ? fmtEur(Number(e.amount) || 0) : fmtCzk(Number(e.amount) || 0);
}

/**
 * Who "Paid by" starts on for a new expense: the payer last picked on this
 * device while they're still on the trip, else the one traveller whose first
 * name matches yours. Empty when neither is known, so nobody gets charged by
 * accident.
 */
export function defaultPayer(people: Person[], meName: string | null | undefined, last: string | null | undefined): string {
  if (last && people.some((p) => p.id === last)) return last;
  const first = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0].toLowerCase();
  const me = first(meName);
  if (!me) return "";
  const hits = people.filter((p) => first(p.name) === me);
  return hits.length === 1 ? hits[0].id : "";
}

/**
 * Net position per person in koruna: positive means they should get money
 * back, negative means they owe. An expense with an empty split is shared by
 * everyone on the trip. People who were removed but still appear in an
 * expense keep their balance, so nothing silently disappears.
 */
export function balances(people: Person[], expenses: Expense[], rate: number): Record<string, number> {
  const cents: Record<string, number> = {};
  for (const p of people) cents[p.id] = 0;
  for (const e of expenses) {
    const split = Array.isArray(e.split) && e.split.length ? e.split : people.map((p) => p.id);
    if (!split.length || !e.paidBy) continue;
    const total = Math.round(toCzk(e, rate) * 100);
    if (total <= 0) continue;
    cents[e.paidBy] = (cents[e.paidBy] ?? 0) + total;
    // Spread the remainder over the first few people so shares add up exactly.
    const base = Math.floor(total / split.length);
    let rest = total - base * split.length;
    for (const id of split) {
      const share = base + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
      cents[id] = (cents[id] ?? 0) - share;
    }
  }
  const out: Record<string, number> = {};
  for (const [id, c] of Object.entries(cents)) out[id] = c / 100;
  return out;
}

/**
 * Turn balances into a short list of payments: the biggest debtor pays the
 * biggest creditor until everyone is within `epsilon` koruna of square.
 */
export function settle(bal: Record<string, number>, epsilon = 0.5): Transfer[] {
  const cr: [string, number][] = [];
  const dr: [string, number][] = [];
  for (const [id, v] of Object.entries(bal)) {
    if (v > epsilon) cr.push([id, v]);
    else if (v < -epsilon) dr.push([id, -v]);
  }
  cr.sort((a, b) => b[1] - a[1]);
  dr.sort((a, b) => b[1] - a[1]);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < dr.length && j < cr.length) {
    const x = Math.min(dr[i][1], cr[j][1]);
    out.push({ from: dr[i][0], to: cr[j][0], amt: Math.round(x * 100) / 100 });
    dr[i][1] -= x;
    cr[j][1] -= x;
    if (dr[i][1] < epsilon) i++;
    if (cr[j][1] < epsilon) j++;
  }
  return out;
}
