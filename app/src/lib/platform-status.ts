import { CHAIN_LABELS, isChainKey } from "./chainKeys.ts";

export type ServiceState = "available" | "delayed" | "unavailable";
export type StatusItem = { name: string; state: ServiceState; detail: string };
export type PlatformStatus = { healthy: boolean; items: StatusItem[] };

/** Only publish known service facts; provider errors and request bodies never become UI copy. */
export function platformStatus(value: unknown): PlatformStatus {
  if (!value || typeof value !== "object") throw new Error("Invalid status response");
  const v = value as Record<string, unknown>;
  if (typeof v.db !== "boolean" || typeof v.transactions !== "boolean" || typeof v.uploads !== "boolean" || !Array.isArray(v.chains)) throw new Error("Incomplete status response");
  const items: StatusItem[] = [
    { name: "Platform data", state: v.db ? "available" : "unavailable", detail: v.db ? "Token pages and platform records are accessible." : "Platform records are temporarily unavailable." },
    { name: "Launches & trading", state: v.transactions ? "available" : "unavailable", detail: v.transactions ? "Transaction submission is enabled. Wallet approval and network confirmation are still required." : "Transaction submission is currently disabled." },
    { name: "Image uploads", state: v.uploads ? "available" : "unavailable", detail: v.uploads ? "Token artwork and banner storage is configured." : "Token artwork and banner uploads are unavailable." },
  ];
  const seen = new Set<string>();
  for (const row of v.chains) {
    if (!row || typeof row !== "object") throw new Error("Invalid network status");
    const c = row as Record<string, unknown>;
    if (!isChainKey(c.chain) || seen.has(c.chain)) continue;
    seen.add(c.chain);
    const delayed = c.delayed !== false;
    items.push({ name: `${CHAIN_LABELS[c.chain]} indexing`, state: delayed ? "delayed" : "available", detail: delayed ? "New launches, trades and balances in indexed views may appear late. Check the network explorer to confirm a submitted transaction before retrying." : "The indexer is within its freshness threshold." });
  }
  if (seen.size === 0) items.push({ name: "Network indexing", state: "unavailable", detail: "Network freshness could not be confirmed." });
  return { healthy: v.ok === true && items.every(i => i.state === "available"), items };
}
