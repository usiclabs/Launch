import { parseTemplate } from "./workspace-tools.ts";
import { parseWatchlist, WATCHLIST_STORAGE_KEY } from "./watchlist.ts";
import { parseAlerts, ALERT_KEY } from "./price-alerts.ts";
export const KEYS = {
  watchlist: WATCHLIST_STORAGE_KEY,
  templates: "launch:templates:v1",
  projects: "launch:projects:v1",
  alerts: ALERT_KEY,
  views: "launch:views:v1",
  preferences: "launch:display:v1",
} as const;
export type Backup = {
  version: 1;
  app: "LAUNCH";
  data: Record<keyof typeof KEYS, unknown>;
};
export function validate(raw: string): Backup {
  if (raw.length > 400000) throw Error("Backup exceeds 400 KB.");
  const b = JSON.parse(raw);
  if (b?.version !== 1 || b.app !== "LAUNCH" || !b.data)
    throw Error("Not a LAUNCH workspace backup.");
  const data = {} as Backup["data"];
  for (const name of Object.keys(KEYS) as (keyof typeof KEYS)[]) {
    const v = b.data[name];
    if (name === "preferences") {
      if (v === null) {
        data[name] = null;
        continue;
      }
      if (
        !v ||
        !["base", "robinhood"].includes(v.chain) ||
        !["auto", "1m", "5m", "15m", "1h", "4h", "1d"].includes(v.interval)
      )
        throw Error("Invalid preferences.");
      data[name] = { chain: v.chain, interval: v.interval };
      continue;
    }
    if (!Array.isArray(v) || v.length > (name === "watchlist" ? 50 : 10))
      throw Error(`Invalid ${name}.`);
    if (name === "watchlist") {
      const rows = parseWatchlist(JSON.stringify({ version: 1, entries: v }));
      if (rows.length !== v.length) throw Error("Invalid watchlist.");
      data[name] = rows;
    } else if (name === "templates" || name === "projects") {
      const rows = v.map((x) => parseTemplate(JSON.stringify(x)));
      if (
        rows.some((x) => !x) ||
        new Set(rows.map((x) => x?.label)).size !== rows.length
      )
        throw Error(`Invalid ${name}.`);
      data[name] = rows;
    } else if (name === "alerts") {
      const rows = parseAlerts(JSON.stringify(v));
      if (
        rows.length !== v.length ||
        new Set(rows.map((x) => x.id)).size !== rows.length
      )
        throw Error("Invalid alerts.");
      data[name] = rows.map((a) => ({
        id: a.id,
        chain: a.chain,
        token: a.token,
        symbol: a.symbol,
        metric: a.metric,
        direction: a.direction,
        target: a.target,
        firedAt: a.firedAt,
      }));
    } else {
      data[name] = v.map((x) => {
        if (
          !x ||
          typeof x.name !== "string" ||
          !x.name.trim() ||
          x.name.length > 50 ||
          typeof x.url !== "string" ||
          !x.url.startsWith("/?") ||
          x.url.length > 500
        )
          throw Error("Invalid view.");
        const u = new URL(x.url, "https://launch.invalid");
        for (const [k, val] of u.searchParams)
          if (
            !["sort", "window", "chain", "filter", "view"].includes(k) ||
            !/^[a-zA-Z0-9_-]{0,60}$/.test(val)
          )
            throw Error("Invalid view filters.");
        if (u.hash && u.hash !== "#launches")
          throw Error("Invalid view anchor.");
        return { name: x.name, url: `/?${u.searchParams}#launches` };
      });
    }
  }
  return { version: 1, app: "LAUNCH", data };
}
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function backup(s: Store): Backup {
  const data: Record<string, unknown> = {};
  for (const [name, key] of Object.entries(KEYS)) {
    const raw = s.getItem(key);
    const v = raw ? JSON.parse(raw) : name === "preferences" ? null : [];
    data[name] = name === "watchlist" && raw ? v.entries : v;
  }
  return validate(JSON.stringify({ version: 1, app: "LAUNCH", data }));
}
export function restore(s: Store, input: Backup) {
  const b = validate(JSON.stringify(input));
  const previous = Object.values(KEYS).map((k) => [k, s.getItem(k)] as const);
  try {
    for (const [name, key] of Object.entries(KEYS)) {
      const v = b.data[name as keyof typeof KEYS];
      if (v === null) s.removeItem(key);
      else
        s.setItem(
          key,
          JSON.stringify(name === "watchlist" ? { version: 1, entries: v } : v),
        );
    }
  } catch {
    let ok = true;
    for (const [k, v] of previous)
      try {
        if (v === null) s.removeItem(k);
        else s.setItem(k, v);
      } catch {
        ok = false;
      }
    throw Error(
      ok
        ? "Restore failed. Previous data restored."
        : "Restore interrupted; keep your backup and review browser data.",
    );
  }
}
