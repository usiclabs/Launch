import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import SectionIntro from "@/components/sections/SectionIntro";
import shell from "@/components/sections/SectionShell.module.css";
import { ChainLogo } from "@/components/launchpad/ChainLogo";
import { checkPlatformToken } from "@/lib/launchpad/platformTokenCheck";
export const dynamic = "force-dynamic";
export default async function TokenCheckPage() {
  const checks = await Promise.all([checkPlatformToken("base"), checkPlatformToken("robinhood")]);
  return <main className={`${shell.page} bb-utility`}>
    <SectionIntro eyebrow="Pairing verification" icon={<ShieldCheck />} title="BNKR integration checks" description="Read-only checks of the exact pairing contracts. Liquidity results are discovery candidates, rather than approved trading routes.">
      <Link href="/launch" className={shell.action}><ArrowLeft size={14} aria-hidden="true" />Back to launch</Link>
    </SectionIntro>
    <div className="grid items-start gap-5 md:grid-cols-2">{checks.map(c=><section key={c.chain} className="bb-surface min-w-0 overflow-hidden rounded-3xl border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line bg-paper/60 px-5 py-4"><ChainLogo chain={c.chain} size={18}/><h2 className="text-base font-semibold text-ink">{c.chain==="base"?"Base":"Robinhood Chain"}</h2></div>
      <div className="space-y-5 p-5 sm:p-6">
        <div><p className="mb-2 text-[11px] font-medium text-muted">Token contract</p><code className="block break-all rounded-xl border border-line bg-paper px-3 py-3 text-xs text-body">{c.address}</code></div>
        <dl className="space-y-3 text-xs"><div className="flex flex-wrap justify-between gap-2 border-b border-line pb-3"><dt className="text-muted">Contract metadata</dt><dd className="font-medium text-ink">{c.metadata.status}</dd></div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-line pb-3"><dt className="text-muted">Liquidity discovery</dt><dd className="font-medium text-ink">{c.liquidity.status}</dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted">Price source</dt><dd className="font-medium text-ink">{c.pricing.status}</dd></div></dl>
        {"symbol" in c.metadata?<p className="text-sm text-body">{c.metadata.name} · {c.metadata.symbol} · {c.metadata.decimals} decimals · chain {c.metadata.chainId}</p>:<p className="break-words text-xs leading-relaxed text-muted">{c.metadata.reason}</p>}
        {c.liquidity.pools.map(p=><div key={p.address} className="rounded-xl border border-line bg-paper p-3 text-xs"><p className="font-medium text-ink">{p.dex} · BNKR / {p.quote}</p><p className="mt-1 text-muted">Reported liquidity ${p.liquidityUsd.toLocaleString()}</p><code className="mt-2 block break-all text-[11px] text-muted">{p.address}</code></div>)}
        <div className="rounded-xl border border-line bg-paper p-3"><p className="text-xs text-body">{c.pricing.usd!==null?`$${c.pricing.usd.toPrecision(6)} / BNKR`:"USD price unavailable"}</p><code className="mt-1 block break-all text-[11px] text-muted">{c.pricing.pool}</code></div>
        <p className="border-t border-line pt-4 text-[11px] leading-relaxed text-muted">These checks do not submit transactions. Last checked {c.checkedAt}.</p>
      </div>
    </section>)}</div>
  </main>;
}
