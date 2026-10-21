export type RecentToken = {
  chain: "base" | "robinhood" | "arc";
  token: string;
  name: string;
  symbol: string;
  image: string | null;
  viewedAt: number;
};
export const RECENT_TOKENS_KEY = "launch:recent-tokens:v1";
export const RECENT_SEARCHES_KEY = "launch:recent-searches:v1";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
export const isContractAddress = (value: string) => /^0x[0-9a-fA-F]{40}$/.test(value.trim());

export function parseRecentTokens(raw: string | null, now = Date.now()): RecentToken[] {
  try {
    if (!raw || raw.length > 24000) return [];
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    const out: RecentToken[] = [];
    for (const value of values) {
      if (!value || typeof value !== "object") continue;
      const v = value as RecentToken;
      if (!["base", "robinhood", "arc"].includes(v.chain) || typeof v.token !== "string" || !isContractAddress(v.token))
        continue;
      if (
        typeof v.name !== "string" ||
        !v.name.trim() ||
        v.name.length > 80 ||
        typeof v.symbol !== "string" ||
        v.symbol.length > 40
      )
        continue;
      if (!Number.isFinite(v.viewedAt) || v.viewedAt > now + 60000 || now - v.viewedAt > MAX_AGE) continue;
      const token = v.token.trim().toLowerCase();
      if (out.some((item) => item.chain === v.chain && item.token === token)) continue;
      out.push({
        chain: v.chain,
        token,
        name: v.name,
        symbol: v.symbol,
        viewedAt: v.viewedAt,
        image: typeof v.image === "string" && v.image.length <= 2048 && /^https:\/\//.test(v.image) ? v.image : null,
      });
      if (out.length === 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

export function parseRecentSearches(raw: string | null): string[] {
  try {
    if (!raw || raw.length > 4000) return [];
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values)) return [];
    const out: string[] = [];
    for (const value of values) {
      if (typeof value !== "string") continue;
      const q = value.trim();
      if (q.length < 2 || q.length > 80 || out.some((item) => item.toLowerCase() === q.toLowerCase())) continue;
      out.push(q);
      if (out.length === 6) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Stable snapshots, with an in-memory fallback if browser storage is denied or full. */
export function createHistoryStore<T>(options: {
  read: () => string | null;
  write: (raw: string) => void;
  parse: (raw: string | null) => T[];
}) {
  let snapshot = { items: [] as T[], ready: false, storageError: false };
  const server = snapshot;
  const listeners = new Set<() => void>();
  function emit(next: typeof snapshot) {
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
    snapshot = next;
    listeners.forEach((fn) => fn());
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => server,
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    refresh: () => {
      try {
        emit({ items: options.parse(options.read()), ready: true, storageError: false });
      } catch {
        emit({ ...snapshot, ready: true, storageError: true });
      }
    },
    update: (reduce: (items: T[]) => T[]) => {
      // Read once before the first write, so a token-page visit preserves prior history.
      if (!snapshot.ready) {
        try {
          snapshot = { items: options.parse(options.read()), ready: true, storageError: false };
        } catch {
          snapshot = { ...snapshot, ready: true, storageError: true };
        }
      }
      const items = reduce(snapshot.items);
      try {
        options.write(JSON.stringify(items));
        emit({ items, ready: true, storageError: false });
      } catch {
        emit({ items, ready: true, storageError: true });
      }
    },
  };
}
