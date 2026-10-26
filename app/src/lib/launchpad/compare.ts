import { isChainKey, type ChainKey } from "../chainKeys.ts";
export type CompareKey = { chain: ChainKey; token: string };
export function parseCompareKeys(value: string): CompareKey[] {
  const seen = new Set<string>();
  return value.slice(0, 300).split(",").flatMap(part => {
    const [chain, token, extra] = part.split(":");
    if (extra || !isChainKey(chain) || !/^0x[0-9a-f]{40}$/i.test(token ?? "")) return [];
    const key = `${chain}:${token.toLowerCase()}`;
    if (seen.has(key)) return [];
    seen.add(key); return [{ chain, token: token.toLowerCase() }];
  }).slice(0, 3);
}
export function compareQuery(keys: CompareKey[]): string { return keys.map(k => `${k.chain}:${k.token.toLowerCase()}`).join(","); }
