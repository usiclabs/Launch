import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info } from "lucide-react";
import SectionIntro from "@/components/sections/SectionIntro";
import shell from "@/components/sections/SectionShell.module.css";
import { BRAND, BRAND_GITHUB, PUBLIC_SOURCE_VISIBLE, BRAND_X } from "@/lib/brand";
import { BASE_PUBLIC_ENABLED, PUBLIC_CHAIN_KEYS, CHAIN_LABELS, CHAINS } from "@/lib/chainPublic";
import { chainLandingPath } from "@/lib/chainLanding";
import { hasChainPage } from "@/lib/launchpad/config";

/**
 * The entity page: the one URL that answers "what is LAUNCH" in plain words, names the
 * official channels, and separates the brand from look-alikes. Facts only (CONTRIBUTING.md):
 * what the contracts do, where the code is, which accounts are ours. No claims about value.
 */
export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: `About ${BRAND}`,
  description: `${BRAND} is a free token launchpad on ${BASE_PUBLIC_ENABLED ? "Base and Robinhood Chain" : "Robinhood Chain"}, with Arc coming soon. What it does, who builds it, and which channels are official.`,
});

const DIFFERENCES = [
  ["No platform fee", "The factory and the locker have no fee address, fee variable or treasury. There is nothing to switch on later."],
  ["Liquidity locked forever", "100% of the supply goes into one Uniswap v4 position at launch. Its NFT is held by an ownerless locker with no withdraw path: not the creator, not LAUNCH, nobody."],
  ["No pre-mine, no admin", "Every token starts inside the pool. The contracts have no owner, no pause, no upgrade and no allowlist. They are the same for everyone."],
  ["Clear launch rules", "Fixed supply, permanent liquidity locks and creator-set fees. Review each launch before you sign."],
  ["Creator-set trading fee", "0%, 1% or 3%, chosen at launch, paid in full to the beneficiaries the creator names or burned. Fixed forever."],
  ["Open to agents", "A launch is one contract call from any wallet. The list, trades and metadata are also plain JSON, with no API key."],
] as const;

export default function AboutPage() {
  return (
    <main className={shell.page}>
      <SectionIntro
        eyebrow="About"
        icon={<Info />}
        title={`What ${BRAND} is`}
        description={<>{BRAND} is a free token launchpad. One transaction deploys a fixed-supply ERC-20, opens a Uniswap v4 pool at the market cap you pick and locks 100% of the supply as liquidity, forever. Live on {BASE_PUBLIC_ENABLED ? "Base and Robinhood Chain" : "Robinhood Chain"}. Arc is coming soon.</>}
      >
        <Link href="/launch" className={shell.action}>Launch a token <ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href="/rules" className={shell.textLink}>How it works <ArrowRight size={14} aria-hidden="true" /></Link>
      </SectionIntro>

      <section className={shell.anchorSection} id="different" aria-labelledby="different-heading">
        <h2 id="different-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">What makes {BRAND} different</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {DIFFERENCES.map(([title, body]) => (
            <li key={title} className="bb-detail-tile rounded-2xl border border-line bg-card p-5">
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${shell.anchorSection} mt-14`} id="chains" aria-labelledby="chains-heading">
        <h2 id="chains-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">Where it runs</h2>
        <p className="mt-4 max-w-[40rem] text-base leading-relaxed text-body text-pretty">The same launch mechanics run on {BASE_PUBLIC_ENABLED ? "Base and Robinhood Chain" : "Robinhood Chain"} using each network&apos;s Uniswap v4 contracts. Arc support is coming soon. Addresses and verification records are listed on the <Link href="/rules#contracts" className="text-brand underline decoration-line-strong underline-offset-4 hover:text-ink">contracts section</Link> of the how-it-works page.</p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {PUBLIC_CHAIN_KEYS.map((chain) => (
            <div key={chain} className="bb-detail-tile rounded-2xl border border-line bg-card p-5">
              <dt className="text-sm font-semibold text-ink">{hasChainPage(chain) ? <Link href={chainLandingPath(chain)} className="hover:text-brand underline decoration-line-strong underline-offset-4">{CHAIN_LABELS[chain]}</Link> : CHAIN_LABELS[chain]}</dt>
              <dd className="mt-1 font-mono text-xs text-muted tnum">Chain ID {CHAINS[chain].id}{!hasChainPage(chain) ? " · Coming soon" : ""}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${shell.anchorSection} mt-14`} id="who" aria-labelledby="who-heading">
        <h2 id="who-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">Who builds it</h2>
        <p className="mt-4 max-w-[40rem] text-base leading-relaxed text-body text-pretty">{BRAND} is maintained by USIC Labs. The platform brings token creation, trading and community discovery together in one place.</p>
        <p className="mt-3 max-w-[40rem] text-base leading-relaxed text-body text-pretty">Tokens launched here are created by their launchers, not by {BRAND}. A locked pool does not make a token valuable; read <Link href="/rules#know" className="text-brand underline decoration-line-strong underline-offset-4 hover:text-ink">before you begin</Link>.</p>
      </section>

      <section className={`${shell.anchorSection} mt-14`} id="official" aria-labelledby="official-heading">
        <h2 id="official-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">Official channels</h2>
        <p className="mt-4 max-w-[40rem] text-base leading-relaxed text-body text-pretty">These are the only places {BRAND} speaks from. Accounts, domains and repositories with similar names are not affiliated with {BRAND}, and links here identify this deployment.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          <li className="bb-detail-tile rounded-2xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Website</p>
            <Link href="/" className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-ink hover:text-brand">LAUNCH</Link>
            <p className="mt-2 text-xs leading-relaxed text-muted">The official LAUNCH website.</p>
          </li>
          <li className="bb-detail-tile rounded-2xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">X</p>
            <a href={`https://x.com/${BRAND_X}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-ink hover:text-brand">@{BRAND_X} <ArrowUpRight size={13} aria-hidden="true" /></a>
            <p className="mt-2 text-xs leading-relaxed text-muted">Launch notes and updates.</p>
          </li>
          {PUBLIC_SOURCE_VISIBLE && (<li className="bb-detail-tile rounded-2xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Source code</p>
            {PUBLIC_SOURCE_VISIBLE && (<a href={BRAND_GITHUB} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-ink hover:text-brand">usiclabs/Launch <ArrowUpRight size={13} aria-hidden="true" /></a>)}
            <p className="mt-2 text-xs leading-relaxed text-muted">LAUNCH source code, available under the MIT license.</p>
          </li>)}
        </ul>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/launch" className={shell.action}>Launch a token <ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href="/agents" className={shell.textLink}>Launch from an agent <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
    </main>
  );
}
