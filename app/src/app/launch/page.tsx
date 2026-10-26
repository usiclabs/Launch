import {cookies} from "next/headers";
import { platformTokenPrice } from "@/lib/launchpad/platformTokenPrice";
import type { Metadata } from "next";
import { TOKEN_PREVIEW } from "@/lib/launchpad/platformToken";
import { pageMetadata } from "@/lib/seo";
import LaunchForm from "@/components/launchpad/LaunchForm";
import SectionIntro from "@/components/sections/SectionIntro";
import { Rocket } from "lucide-react";
import { ethUsd } from "@/lib/launchpad/ethPrice";
import { DEFAULT_CHAIN, chainKeyOr, type ChainKey } from "@/lib/chainPublic";
import { CONFIGURED_CHAINS, launchpad } from "@/lib/launchpad/config";

export const metadata: Metadata = pageMetadata({
  path: "/launch",
  title: "Launch a token for free",
  description: "Deploy a token on Base, Robinhood Chain or Arc with 100% of supply locked as Uniswap v4 liquidity. No platform fee. Gas only.",
});

export const dynamic = "force-dynamic";

/** The requested chain, unless it has no contracts here: then the first configured one (the default in development, where none may be). */
function initialChainFor(param: string | undefined): ChainKey {
  const wanted = chainKeyOr(param, DEFAULT_CHAIN);
  return launchpad(wanted).configured ? wanted : (CONFIGURED_CHAINS[0] ?? wanted);
}

export default async function LaunchPage({ searchParams }: { searchParams: Promise<{ chain?: string }> }) {
  const sp = await searchParams;
  const preferred=(await cookies()).get("launch_preferred_chain")?.value;
  const [usd, basePrice, robinhoodPrice] = await Promise.all([ethUsd(), platformTokenPrice("base"), platformTokenPrice("robinhood")]);
  return (
    <>
      <main className="bb-launch-form relative mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-10 pb-16 space-y-5 sm:space-y-6">
        <SectionIntro compact eyebrow="Make something yours" icon={<Rocket />} title="Launch a token" description="Give your token an identity, choose its launch settings, and preview the result. You’ll review the transaction in your wallet before anything goes onchain." />
        <p className="rounded-xl border border-line bg-card/70 px-4 py-3 text-xs leading-relaxed text-muted">{TOKEN_PREVIEW ? "Read-only preview: launch transactions are disabled. " : ""}LAUNCH’s platform token is coming soon. Until then, you can use BNKR as a quote asset. <a className="font-medium text-ink underline underline-offset-4 hover:text-brand" href="/token-check">Verify the pairing</a></p>
        <LaunchForm ethUsd={usd} platformPrices={{ base: basePrice.usd, robinhood: robinhoodPrice.usd, arc: null }} initialChain={initialChainFor(sp.chain ?? preferred)} />
      </main>
    </>
  );
}
