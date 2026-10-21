import type { ChainKey } from "../chainPublic";
import type { LaunchFilter } from "./search";
import type { LaunchSort, VolumeWindow } from "./queries";

export const MARKET_COOKIE = "launch_market_v1";
export type MarketPreferences = { sort: LaunchSort; window: VolumeWindow; chain: ChainKey | null; filter: LaunchFilter | null };
export function parseMarketPreferences(raw: string | undefined): MarketPreferences | null {
  if (!raw || raw.length > 800) return null;
  try {
    const d = JSON.parse(decodeURIComponent(raw));
    if (!d || !["live", "new", "mcap", "volume", "gainers", "holders"].includes(d.sort) || !["1h", "24h", "all"].includes(d.window)) return null;
    if (d.chain !== null && !["base", "robinhood", "arc"].includes(d.chain)) return null;
    // Filters are checked against the live configuration at the point of use.
    if (d.filter !== null && (typeof d.filter !== "string" || d.filter.length > 40)) return null;
    return { sort: d.sort, window: d.window, chain: d.chain, filter: d.filter };
  } catch { return null; }
}
export function marketCookie(preferences: MarketPreferences): string {
  return `${MARKET_COOKIE}=${encodeURIComponent(JSON.stringify(preferences))}; path=/; max-age=31536000; samesite=lax`;
}
