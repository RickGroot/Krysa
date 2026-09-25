import { describe, expect, it } from "vitest";
import { balances, fmtCzk, fmtEur, rateOf, settle, toCzk, type Expense, type Person } from "../src/lib/money";

const people: Person[] = [{ id: "sam" }, { id: "jules" }, { id: "alex" }];
const sum = (b: Record<string, number>) => Object.values(b).reduce((a, x) => a + x, 0);
const nbsp = (s: string) => s.replace(/ | /g, " ");

describe("rateOf", () => {
  it("uses the stored rate when it is sensible", () => {
    expect(rateOf({ eurCzk: 24.34 })).toBe(24.34);
    expect(rateOf({ eurCzk: "25" })).toBe(25);
  });
  it("falls back to the default for missing or silly values", () => {
    expect(rateOf(undefined)).toBe(24.3);
    expect(rateOf({ eurCzk: 0 })).toBe(24.3);
    expect(rateOf({ eurCzk: 1000 })).toBe(24.3);
  });
});

describe("toCzk", () => {
  it("converts euro and leaves koruna alone", () => {
    expect(toCzk({ amount: 10, currency: "EUR" }, 24.3)).toBeCloseTo(243);
    expect(toCzk({ amount: 285, currency: "CZK" }, 24.3)).toBe(285);
    expect(toCzk({ amount: "12.5", currency: "EUR" }, 24)).toBe(300);
  });
  it("treats garbage as zero", () => {
    expect(toCzk({ amount: "abc" }, 24.3)).toBe(0);
  });
});

describe("balances", () => {
  it("splits evenly between everyone when no split is given", () => {
    const b = balances(people, [{ amount: 1500, currency: "CZK", paidBy: "alex" }], 24.3);
    expect(b).toEqual({ sam: -500, jules: -500, alex: 1000 });
    expect(sum(b)).toBeCloseTo(0, 6);
  });

  it("only charges the people ticked", () => {
    const b = balances(people, [{ amount: 600, paidBy: "sam", split: ["sam", "jules"] }], 24.3);
    expect(b).toEqual({ sam: 300, jules: -300, alex: 0 });
  });

  it("lets someone pay for others without joining", () => {
    const b = balances(people, [{ amount: 900, paidBy: "alex", split: ["sam", "jules"] }], 24.3);
    expect(b).toEqual({ sam: -450, jules: -450, alex: 900 });
  });

  it("mixes koruna and euro at the trip rate", () => {
    const ex: Expense[] = [
      { amount: 30, currency: "EUR", paidBy: "jules" }, // 729 Kč
      { amount: 1200, currency: "CZK", paidBy: "alex" },
    ];
    const b = balances(people, ex, 24.3);
    expect(b.jules).toBeCloseTo(729 - 643, 2);
    expect(b.alex).toBeCloseTo(1200 - 643, 2);
    expect(b.sam).toBeCloseTo(-643, 2);
    expect(sum(b)).toBeCloseTo(0, 6);
  });

  it("never loses haléře when the total doesn't divide evenly", () => {
    const b = balances(people, [{ amount: 100, paidBy: "sam" }], 24.3);
    expect(sum(b)).toBeCloseTo(0, 6);
    expect(Object.values(b).every((v) => Number.isInteger(Math.round(v * 100)))).toBe(true);
  });

  it("keeps balances for people who were removed from the trip", () => {
    const b = balances([{ id: "sam" }], [{ amount: 200, paidBy: "ghost", split: ["sam", "ghost"] }], 24.3);
    expect(b).toEqual({ sam: -100, ghost: 100 });
  });

  it("ignores expenses without a payer or amount", () => {
    expect(balances(people, [{ amount: 100 }, { amount: 0, paidBy: "sam" }], 24.3)).toEqual({ sam: 0, jules: 0, alex: 0 });
  });
});

describe("settle", () => {
  it("pays the creditor from each debtor", () => {
    const t = settle({ sam: -500, jules: -500, alex: 1000 });
    expect(t).toHaveLength(2);
    expect(t.every((x) => x.to === "alex" && x.amt === 500)).toBe(true);
  });

  it("uses no more payments than people minus one", () => {
    const b = { a: 300, b: 200, c: -100, d: -150, e: -250 };
    const t = settle(b);
    expect(t.length).toBeLessThanOrEqual(4);
    const paid: Record<string, number> = {};
    for (const x of t) {
      paid[x.from] = (paid[x.from] ?? 0) - x.amt;
      paid[x.to] = (paid[x.to] ?? 0) + x.amt;
    }
    for (const [k, v] of Object.entries(b)) expect(paid[k] ?? 0).toBeCloseTo(v, 2);
  });

  it("returns nothing when everyone is square", () => {
    expect(settle({ a: 0.2, b: -0.2 })).toEqual([]);
  });

  it("round-trips a realistic week", () => {
    const ex: Expense[] = [
      { amount: 1450, paidBy: "alex" },
      { amount: 42.5, currency: "EUR", paidBy: "sam", split: ["sam", "jules"] },
      { amount: 380, paidBy: "jules", split: ["alex", "jules"] },
    ];
    const b = balances(people, ex, 24.3);
    const t = settle(b);
    const after = { ...b };
    for (const x of t) {
      after[x.from] += x.amt;
      after[x.to] -= x.amt;
    }
    for (const v of Object.values(after)) expect(Math.abs(v)).toBeLessThan(0.5);
  });
});

describe("formatting", () => {
  it("formats koruna the Czech way", () => {
    expect(nbsp(fmtCzk(1250))).toBe("1 250 Kč");
    expect(fmtCzk(285.4)).toBe("285 Kč");
  });
  it("formats euro with two decimals", () => {
    expect(fmtEur(11.728)).toBe("€11.73");
  });
});
