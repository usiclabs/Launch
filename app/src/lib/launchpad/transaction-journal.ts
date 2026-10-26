import { isChainKey, type ChainKey } from "../chainKeys.ts";
export const JOURNAL_KEY = "launch:transactions:v1";
export type SavedTransaction = { hash: `0x${string}`; wallet: string; chain: ChainKey; kind: "launch" | "swap" | "collect" | "approval"; label: string; token?: string; replacementHash?: `0x${string}`; state: "pending" | "confirmed" | "reverted" | "replaced"; createdAt: number };
const address = /^0x[0-9a-f]{40}$/i;
export function parseJournal(raw: string | null): SavedTransaction[] {
  try {
    const data: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data.filter((v): v is SavedTransaction => {
      if (!v || typeof v !== "object" || !/^0x[0-9a-f]{64}$/i.test(v.hash) || !address.test(v.wallet) || !isChainKey(v.chain) || !["launch", "swap", "collect", "approval"].includes(v.kind) || !["pending", "confirmed", "reverted", "replaced"].includes(v.state) || typeof v.label !== "string" || v.label.length > 100 || !Number.isFinite(v.createdAt) || (v.token !== undefined && !address.test(v.token)) || (v.replacementHash !== undefined && !/^0x[0-9a-f]{64}$/i.test(v.replacementHash))) return false;
      const key = `${v.chain}:${v.hash.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, 100);
  } catch { return []; }
}
export function upsertTransaction(rows: SavedTransaction[], tx: SavedTransaction): SavedTransaction[] {
  const next = [tx, ...rows.filter(r => !(r.chain === tx.chain && r.hash.toLowerCase() === tx.hash.toLowerCase()))];
  // Never evict a pending transaction to make room for settled history.
  return [...next.filter(r => r.state === "pending"), ...next.filter(r => r.state !== "pending").slice(0, 30)];
}
let memoryFallback: SavedTransaction[] = [];
export function readTransactions(): SavedTransaction[] {
  let rows: SavedTransaction[] = [];
  try { rows = parseJournal(localStorage.getItem(JOURNAL_KEY)); } catch { /* browser storage is unavailable */ }
  for (const tx of memoryFallback) rows = upsertTransaction(rows, tx);
  return rows;
}
export function saveTransaction(tx: SavedTransaction): boolean {
  const rows = upsertTransaction(readTransactions(), tx);
  let persisted = true;
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(rows)); memoryFallback = []; }
  catch { memoryFallback = rows; persisted = false; }
  window.dispatchEvent(new Event(JOURNAL_KEY));
  return persisted;
}
export function settleTransaction(chain: ChainKey, hash: string, state: "confirmed" | "reverted" | "replaced", token?: string, replacementHash?: `0x${string}`): void {
  const tx = readTransactions().find(r => r.chain === chain && r.hash.toLowerCase() === hash.toLowerCase());
  if (tx) saveTransaction({ ...tx, state, ...(token ? { token } : {}), ...(replacementHash ? { replacementHash } : {}) });
}
