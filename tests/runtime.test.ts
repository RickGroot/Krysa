import { describe, expect, it } from "vitest";
import { localRuntime } from "../src/data/local";
import { Store, mergeDeep, newId, type DB, type QuerySnap } from "../src/data/runtime";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("mergeDeep", () => {
  it("merges nested objects and replaces arrays", () => {
    const a = { votes: { u1: true }, tags: ["a"], title: "x" };
    expect(mergeDeep(a, { votes: { u2: true }, tags: ["b"] })).toEqual({ votes: { u1: true, u2: true }, tags: ["b"], title: "x" });
  });
  it("does not mutate the original", () => {
    const a = { n: { x: 1 } };
    mergeDeep(a, { n: { y: 2 } });
    expect(a).toEqual({ n: { x: 1 } });
  });
});

describe("Store", () => {
  it("batches changes into one collection snapshot", async () => {
    const s = new Store();
    const seen: number[] = [];
    s.listenCol("events", (q) => seen.push(q.size));
    s.put("events/a", { t: 1 });
    s.put("events/b", { t: 2 });
    await tick();
    expect(seen).toEqual([2]);
  });
  it("hands out copies so listeners can't corrupt the cache", () => {
    const s = new Store();
    s.put("x/1", { list: [1] }, true);
    const d = s.docSnap("x/1").data() as { list: number[] };
    d.list.push(2);
    expect(s.get("x/1")).toEqual({ list: [1] });
  });
});

describe("local runtime", () => {
  it("creates, merges, lists and deletes documents", async () => {
    const rt = localRuntime({});
    const db = (await rt.use("db")) as DB;
    const snaps: QuerySnap[] = [];
    db.collection("todos").onSnapshot((q) => snaps.push(q));
    const ref = await db.collection("todos").add({ text: "Book Lokál", done: false });
    await db.doc(ref.path).update({ done: true });
    await tick();
    expect(snaps.at(-1)?.docs[0].data()).toEqual({ text: "Book Lokál", done: true });
    await db.doc(ref.path).delete();
    await tick();
    expect(snaps.at(-1)?.size).toBe(0);
  });
  it("refuses to update a document that doesn't exist", async () => {
    const db = (await localRuntime({}).use("db")) as DB;
    await expect(db.doc("todos/missing").update({ done: true })).rejects.toMatchObject({ code: "invalid_argument" });
  });
  it("starts from the seed", async () => {
    const db = (await localRuntime({ "trip/info": { title: "Prague" } }).use("db")) as DB;
    expect((await db.doc("trip/info").get()).data()).toEqual({ title: "Prague" });
  });
});

describe("newId", () => {
  it("fits the id pattern used for uploads", () => {
    expect(newId(32)).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });
});
