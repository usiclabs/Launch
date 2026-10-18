import "server-only";
import { createPublicClient, http, parseAbi } from "viem";
import { CHAINS } from "../chainPublic";
import { PLATFORM_TOKEN } from "./platformToken";
import { ethUsd } from "./ethPrice";

// Candidate pools discovered on 2026-10-18; each read verifies its currencies on-chain.
const SOURCES = {
  base: { pool: "0xaec085e5a5ce8d96a7bdd3eb3a62445d4f6ce703", quote: "0x4200000000000000000000000000000000000006", decimals: 18, symbol: "WETH" },
  robinhood: { pool: "0x04def3e9bbe27113a13abb673b2f29dd4b35b8f9", quote: "0x5fc5360d0400a0fd4f2af552add042d716f1d168", decimals: 6, symbol: "USDG" },
} as const;
const abi = parseAbi([
  "function token0() view returns (address)", "function token1() view returns (address)",
  "function liquidity() view returns (uint128)",
  "function observe(uint32[]) view returns (int56[],uint160[])",
]);
export type PlatformPrice = { usd: number | null; pool: string; quote: string; status: string; checkedAt: string };
const cache = new Map<string, { at: number; result: PlatformPrice }>();
export async function platformTokenPrice(chain: "base" | "robinhood"): Promise<PlatformPrice> {
  const old = cache.get(chain);
  if (old && Date.now() - old.at < 60000) return old.result;
  const source = SOURCES[chain];
  let result: PlatformPrice = { usd: null, pool: source.pool, quote: source.symbol, status: "unavailable", checkedAt: new Date().toISOString() };
  try {
    const client = createPublicClient({ chain: CHAINS[chain], transport: http(chain === "base" ? "https://base-rpc.publicnode.com" : "https://rpc.mainnet.chain.robinhood.com", { timeout: 6000, retryCount: 0 }) });
    const [chainId, t0, t1, liquidity, observed, quoteUsd] = await Promise.all([
      client.getChainId(),
      client.readContract({ address: source.pool, abi, functionName: "token0" }),
      client.readContract({ address: source.pool, abi, functionName: "token1" }),
      client.readContract({ address: source.pool, abi, functionName: "liquidity" }),
      client.readContract({ address: source.pool, abi, functionName: "observe", args: [[1800, 0]] }),
      chain === "base" ? ethUsd() : Promise.resolve(1),
    ]);
    const bnkr = PLATFORM_TOKEN.addresses[chain];
    const zero = t0.toLowerCase(), one = t1.toLowerCase();
    if (chainId !== CHAINS[chain].id || liquidity <= 0n || !((zero === bnkr && one === source.quote) || (one === bnkr && zero === source.quote))) throw new Error("pool mismatch");
    if (!quoteUsd || !Number.isFinite(quoteUsd) || quoteUsd <= 0) throw new Error("quote price unavailable");
    const delta = observed[0][1] - observed[0][0];
    let tick = delta / 1800n;
    if (delta < 0n && delta % 1800n !== 0n) tick -= 1n;
    const ratio = Math.pow(1.0001, Number(tick));
    const usd = (zero === bnkr ? ratio : 1 / ratio) * Math.pow(10, PLATFORM_TOKEN.decimals - source.decimals) * quoteUsd;
    if (!Number.isFinite(usd) || usd <= 0) throw new Error("invalid price");
    result = { ...result, usd, status: "verified-30m-twap" };
  } catch { /* No cross-chain or legacy-token fallback. */ }
  cache.set(chain, { at: Date.now(), result });
  return result;
}
