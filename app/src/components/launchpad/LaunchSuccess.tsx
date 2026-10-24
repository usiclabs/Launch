"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Copy, ExternalLink, LockKeyhole, Rocket, Share2, UserRound } from "lucide-react";
import { CHAIN_LABELS, SITE_URL, explorerAddress, explorerTx, type ChainKey } from "@/lib/chainPublic";
import { btn } from "@/components/ui";
import Mark from "./Mark";

export default function LaunchSuccess({ chain, token, hash, name, symbol, buyNote }: { chain: ChainKey; token: string; hash: string; name: string; symbol: string; buyNote?: string | null }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const path = `/t/${chain}/${token}`;
  const url = `${SITE_URL}${path}`;
  const share = `https://x.com/intent/post?text=${encodeURIComponent(`${name} ($${symbol}) just launched on ${CHAIN_LABELS[chain]} through LAUNCH.\n\nExplore the token:`)}&url=${encodeURIComponent(url)}`;
  useEffect(() => {heading.current?.focus();}, []);
  useEffect(() => {if(!copied) return; const timer=window.setTimeout(()=>setCopied(false),2500);return()=>window.clearTimeout(timer);}, [copied]);
  useEffect(() => {if(!linkCopied) return; const timer=window.setTimeout(()=>setLinkCopied(false),2500);return()=>window.clearTimeout(timer);}, [linkCopied]);
  async function copy() {
    try { await navigator.clipboard.writeText(token); setCopied(true);setCopyError(""); }
    catch { setCopyError("Copy isn’t available here. Select and copy the contract address below."); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setLinkCopied(true); setCopyError(""); }
    catch { setCopyError("Copy isn’t available here. Open your token page to copy its address."); }
  }
  return <section aria-labelledby="launch-success-heading" className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-line-strong bg-card shadow-card bb-rise">
    <div className="relative overflow-hidden border-b border-line bg-brand-soft px-5 pb-8 pt-9 text-center sm:px-8 sm:pt-12">
      <span className="mx-auto mb-5 grid size-20 place-items-center rounded-[26px] border border-brand/20 bg-card shadow-card"><Mark size={48} /></span>
      <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-brand">Confirmed on {CHAIN_LABELS[chain]}</p>
      <h2 ref={heading} tabIndex={-1} id="launch-success-heading" className="mt-3 break-words text-3xl font-semibold leading-tight tracking-[-.045em] text-ink outline-none sm:text-4xl">{name} is live.</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-body">Your token has launched. Share its page, open trading, or head to your dashboard.</p>
      <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-up/20 bg-up-soft px-3 py-1.5 text-xs font-medium text-up"><LockKeyhole size={13} aria-hidden="true" />Liquidity locked forever</span>
    </div>
    <div className="space-y-5 p-5 sm:p-8">
      <div className="grid gap-3 sm:grid-cols-2"><Link href={path} className={`${btn.primary} min-h-12`}>View your token<ArrowRight size={16} aria-hidden="true" /></Link><Link href={`${path}#trade`} className={`${btn.secondary} min-h-12`}>Open trading<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      {buyNote?<p role="status" className="rounded-xl border border-line bg-paper px-4 py-3 text-xs leading-relaxed text-body">{buyNote}</p>:null}
      <div className="rounded-2xl border border-line bg-paper p-4">
        <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-ink">Token contract</p><button type="button" onClick={()=>void copy()} className={`${btn.secondarySm} min-h-11`} aria-label="Copy token contract address">{copied?<Check size={13} aria-hidden="true" />:<Copy size={13} aria-hidden="true" />}{copied?"Copied":"Copy"}</button></div>
        <code className="mt-3 block select-all break-all font-mono text-xs leading-relaxed text-body">{token}</code>
        {copyError?<p role="status" className="mt-2 text-xs text-warm-ink">{copyError}</p>:null}
        <div className="mt-3 flex flex-wrap gap-x-5"><a href={explorerAddress(chain,token)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-ink">View contract<ExternalLink size={12} aria-hidden="true" /></a><a href={explorerTx(chain,hash)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted hover:text-ink">Launch transaction<ExternalLink size={12} aria-hidden="true" /></a></div>
      </div>
      <div className="flex flex-wrap items-center gap-3"><a href={share} target="_blank" rel="noreferrer" className={`${btn.secondary} flex-1`}><Share2 size={15} aria-hidden="true" />Share on X</a><Link href="/me" className={`${btn.secondary} flex-1`}>Your dashboard<ArrowRight size={15} aria-hidden="true" /></Link></div>
      <section aria-labelledby="creator-next-steps" className="rounded-2xl border border-line bg-card p-4">
        <h3 id="creator-next-steps" className="text-xs font-semibold text-ink">Your launch, ready to share</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => void copyLink()} className={`${btn.secondarySm} min-h-11 justify-center`}><Copy size={13} aria-hidden="true" />{linkCopied ? "Page link copied" : "Copy page link"}</button>
          <Link href={`${path}#contracts`} className={`${btn.secondarySm} min-h-11 justify-center`}><ExternalLink size={13} aria-hidden="true" />Pool & onchain record</Link>
          <Link href="/me" className={`${btn.secondarySm} min-h-11 justify-center`}><UserRound size={13} aria-hidden="true" />Complete your profile</Link>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3"><p className="flex items-center gap-1.5 text-[11px] text-muted"><Check size={12} aria-hidden="true" />Launch confirmed. Ready to share.</p><a href="/launch" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-ink hover:text-brand"><Rocket size={13} aria-hidden="true" />Launch another</a></div>
    </div>
  </section>;
}
