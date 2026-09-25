/**
 * The app talks to its data through a small runtime with the same shape as
 * the claude.ai artifact runtime it was first built on:
 * `await runtime.use("db" | "user" | "assets" | "downloads")`.
 * `local.ts` keeps everything in the browser (demo / offline dev) and
 * `supabase.ts` syncs a shared Supabase project.
 */
export type Json = Record<string, unknown>;

export interface DocSnap {
  id: string;
  exists: boolean;
  data(): Json | undefined;
}
export interface QuerySnap {
  docs: DocSnap[];
  size: number;
  empty: boolean;
}
export type Unsubscribe = () => void;
export interface DocRef {
  id: string;
  path: string;
  get(): Promise<DocSnap>;
  set(data: Json): Promise<void>;
  update(patch: Json): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(next: (s: DocSnap) => void, error?: (e: DataError) => void): Unsubscribe;
}
export interface CollectionRef {
  path: string;
  doc(id?: string): DocRef;
  add(data: Json): Promise<DocRef>;
  onSnapshot(next: (s: QuerySnap) => void, error?: (e: DataError) => void): Unsubscribe;
}
export interface DB {
  doc(path: string): DocRef;
  collection(path: string): CollectionRef;
}
export interface Profile {
  id: string;
  name: string;
}
export interface UserNS {
  id(): Promise<string | null>;
  me(): Promise<{ id: string | null; name: string }>;
  isOwner(): Promise<boolean>;
  canEdit(): Promise<boolean>;
  can(capability: string): Promise<boolean | null>;
  profiles(ids: string[]): Promise<Record<string, Profile>>;
}
export interface AssetsNS {
  upload(blob: Blob, options?: { type?: string }): Promise<{ id: string; url: string }>;
  delete(id: string): Promise<{ deleted: boolean }>;
  url(id: string): Promise<string>;
}
export interface DownloadsNS {
  save(req: { filename: string; data: Blob | string }): Promise<{ status: "saved" }>;
}
export interface PushPrefs {
  reminders: boolean;
  posts: boolean;
}
/** Push notifications (Supabase only). The demo has no `push` namespace. */
export interface PushNS {
  /** The key browsers subscribe with; null until the notify function has run once. */
  publicKey(): Promise<string | null>;
  save(sub: { endpoint: string; p256dh: string; auth: string }, prefs: PushPrefs): Promise<void>;
  remove(endpoint: string): Promise<void>;
}
export interface Runtime {
  use(name: string): Promise<unknown>;
}
/** Error codes the UI branches on (same spelling as the artifact runtime). */
export interface DataError {
  code: "invalid_argument" | "unavailable" | "quota_exceeded" | "not_granted" | "declined" | string;
  message: string;
}

export const dataError = (code: DataError["code"], message: string): DataError => ({ code, message });

/** A document id that fits the app's `[A-Za-z0-9_-]{8,64}` asset check too. */
export function newId(len = 20): string {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => a[b % a.length]).join("");
}

/** Objects merge recursively; arrays and scalars replace. Same rule as the SQL `jsonb_deep_merge`. */
export function mergeDeep(target: Json, patch: Json): Json {
  const out: Json = { ...target };
  for (const [k, v] of Object.entries(patch)) {
    const cur = out[k];
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) && cur && typeof cur === "object" && !Array.isArray(cur)
        ? mergeDeep(cur as Json, v as Json)
        : v;
  }
  return out;
}

/** Plain browser download, used outside the artifact sandbox. */
export function browserDownloads(): DownloadsNS {
  return {
    async save({ filename, data }) {
      const blob = typeof data === "string" ? new Blob([data], { type: "text/plain" }) : data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      return { status: "saved" };
    },
  };
}

type ColListener = (s: QuerySnap) => void;
type DocListener = (s: DocSnap) => void;

/**
 * In-memory document cache with listeners. Both backends keep their data here
 * and call `put` when something changes; the UI subscribes through `db`.
 */
export class Store {
  private docs = new Map<string, Json>();
  private colListeners = new Map<string, Set<ColListener>>();
  private docListeners = new Map<string, Set<DocListener>>();
  private pending = new Set<string>();
  private scheduled = false;
  onChange?: () => void;

  static split(path: string): { col: string; id: string } {
    const i = path.lastIndexOf("/");
    return { col: path.slice(0, i), id: path.slice(i + 1) };
  }
  has(path: string): boolean {
    return this.docs.has(path);
  }
  get(path: string): Json | undefined {
    return this.docs.get(path);
  }
  entries(): [string, Json][] {
    return [...this.docs.entries()];
  }
  /** Set or (with `null`) remove a document and notify listeners on the next microtask. */
  put(path: string, data: Json | null, silent = false): void {
    if (data == null) this.docs.delete(path);
    else this.docs.set(path, data);
    if (silent) return;
    this.pending.add(path);
    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => this.flush());
    }
  }
  touchCollection(col: string): void {
    this.pending.add(col + "/*");
    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => this.flush());
    }
  }
  private flush(): void {
    this.scheduled = false;
    const cols = new Set<string>();
    for (const p of this.pending) {
      const { col } = Store.split(p);
      cols.add(col);
      if (!p.endsWith("/*")) this.docListeners.get(p)?.forEach((f) => f(this.docSnap(p)));
    }
    this.pending.clear();
    for (const c of cols) this.colListeners.get(c)?.forEach((f) => f(this.colSnap(c)));
    this.onChange?.();
  }
  docSnap(path: string): DocSnap {
    const d = this.docs.get(path);
    return { id: Store.split(path).id, exists: d !== undefined, data: () => (d ? structuredClone(d) : undefined) };
  }
  colSnap(col: string): QuerySnap {
    const docs: DocSnap[] = [];
    for (const [p, d] of this.docs) {
      const s = Store.split(p);
      if (s.col === col) docs.push({ id: s.id, exists: true, data: () => structuredClone(d) });
    }
    docs.sort((a, b) => a.id.localeCompare(b.id));
    return { docs, size: docs.length, empty: docs.length === 0 };
  }
  listenCol(col: string, f: ColListener): Unsubscribe {
    const set = this.colListeners.get(col) ?? new Set();
    set.add(f);
    this.colListeners.set(col, set);
    return () => set.delete(f);
  }
  listenDoc(path: string, f: DocListener): Unsubscribe {
    const set = this.docListeners.get(path) ?? new Set();
    set.add(f);
    this.docListeners.set(path, set);
    return () => set.delete(f);
  }
}
