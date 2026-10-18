import "server-only";
import { createPublicClient, http, erc20Abi, type Address } from "viem";
import { PLATFORM_TOKEN } from "./platformToken";
import { CHAINS } from "../chainPublic";

export async function checkPlatformToken(chain: "base" | "robinhood") {
  const address = PLATFORM_TOKEN.addresses[chain] as Address;
  const rpc = chain === "base" ? "https://base-rpc.publicnode.com" : "https://rpc.mainnet.chain.robinhood.com";
  const client = createPublicClient({ chain: CHAINS[chain], transport: http(rpc, { timeout: 6000, retryCount: 0 }) });
  const metadata = await (async () => {
    try {
      const [chainId, code, name, symbol, decimals] = await Promise.all([
        client.getChainId(), client.getCode({ address }),
        client.readContract({ address, abi: erc20Abi, functionName: "name" }),
        client.readContract({ address, abi: erc20Abi, functionName: "symbol" }),
        client.readContract({ address, abi: erc20Abi, functionName: "decimals" }),
      ]);
      const verified = chainId === CHAINS[chain].id && Boolean(code && code !== "0x") && symbol === PLATFORM_TOKEN.symbol && decimals === PLATFORM_TOKEN.decimals;
      return { status: verified ? "verified" : "mismatch", chainId, name, symbol, decimals, contractPresent: Boolean(code && code !== "0x") };
    } catch { return { status: "unavailable", reason: "RPC could not verify token metadata. Transactions stay disabled." }; }
  })();
  let liquidity: { status: string; pools: { address: string; dex: string; quote: string; liquidityUsd: number; priceUsd: number | null }[] } = { status: "unavailable", pools: [] };
  try {
    const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/${chain}/${address}`, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (response.ok) {
      const rows = await response.json();
      const pools = (Array.isArray(rows) ? rows : []).filter((p) => p.chainId === chain && p.baseToken?.address?.toLowerCase() === address && Number(p.liquidity?.usd) > 0).map((p) => ({ address: String(p.pairAddress), dex: String(p.dexId), quote: String(p.quoteToken?.symbol ?? ""), liquidityUsd: Number(p.liquidity.usd), priceUsd: Number(p.priceUsd) > 0 ? Number(p.priceUsd) : null })).sort((a, b) => b.liquidityUsd - a.liquidityUsd).slice(0, 5);
      liquidity = { status: pools.length ? "candidates-found" : "no-indexed-pools", pools };
    }
  } catch { /* Missing market data never inherits another token's price. */ }
  return { chain, address, metadata, liquidity, transactionsEnabled: false, pricingEnabled: false, checkedAt: new Date().toISOString() };
}
