import { isChainKey, type ChainKey } from "../chainKeys.ts";
export const ALERT_KEY = "launch:price-alerts:v1";
export type PriceAlert = {
  id: string;
  chain: ChainKey;
  token: string;
  symbol: string;
  metric: "price" | "mcap";
  direction: "above" | "below";
  target: number;
  firedAt: number | null;
};
export function parseAlerts(raw: string | null): PriceAlert[] {
  try {
    const d = JSON.parse(raw ?? "[]");
    if (!Array.isArray(d)) return [];
    return d
      .filter(
        (a): a is PriceAlert =>
          a &&
          typeof a.id === "string" &&
          a.id.length <= 80 &&
          isChainKey(a.chain) &&
          typeof a.token === "string" &&
          /^0x[0-9a-f]{40}$/i.test(a.token) &&
          typeof a.symbol === "string" &&
          a.symbol.length <= 32 &&
          ["price", "mcap"].includes(a.metric) &&
          ["above", "below"].includes(a.direction) &&
          Number.isFinite(a.target) &&
          a.target > 0 &&
          (a.firedAt === null || (Number.isFinite(a.firedAt) && a.firedAt > 0)),
      )
      .slice(0, 10);
  } catch {
    return [];
  }
}
export function targetReached(
  a: PriceAlert,
  value: number | null,
  healthy: boolean,
): boolean {
  return (
    healthy &&
    a.firedAt === null &&
    value !== null &&
    Number.isFinite(value) &&
    (a.direction === "above" ? value >= a.target : value <= a.target)
  );
}
