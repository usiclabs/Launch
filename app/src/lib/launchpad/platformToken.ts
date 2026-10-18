import type { ChainKey } from "../chainKeys.ts";

/** Temporary integration, isolated on the bnkr-test branch. Never relabel legacy pools. */
export const PLATFORM_TOKEN = {
  symbol: "BNKR",
  name: "BankrCoin",
  decimals: 18,
  website: "https://bankr.bot",
  addresses: {
    base: "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
    robinhood: "0x178e54df3d091ee4d0b2534742ef9e3692b76526",
    arc: null,
  } satisfies Record<ChainKey, `0x${string}` | null>,
} as const;
export const TOKEN_PREVIEW = true;
export function isPlatformToken(chain: ChainKey, address: string): boolean {
  return PLATFORM_TOKEN.addresses[chain] !== null && PLATFORM_TOKEN.addresses[chain] === address.toLowerCase();
}
