"use client";
import Link from "next/link";
import { useState } from "react";
import type { LaunchRow } from "@/lib/launchpad/queries";
import { CHAIN_LABELS } from "@/lib/chainPublic";
import { fmtUsd } from "@/lib/launchpad/math";
/** Creator statistics use only the launches already loaded for this wallet. */
export default function CreatorWorkspace({ launches }: { launches: LaunchRow[] }) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("recent");
  const selected = launches.filter(l => `${l.name} ${l.symbol} ${l.token} ${CHAIN_LABELS[l.chain]}`.toLowerCase().includes(query.trim().toLowerCase()));
  const sorted = [...selected].sort((a, b) => order === "activity" ? b.buys + b.sells - a.buys - a.sells : new Date(b.block_time).getTime() - new Date(a.block_time).getTime());
  const priced = launches.filter(l => l.volume_24h_usd !== null);
  const volume = priced.reduce((n, l) => n + (l.volume_24h_usd ?? 0), 0);
  return <section className="rounded-2xl border border-line bg-card p-4 sm:p-5" aria-labelledby="creator-workspace">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="creator-workspace" className="text-sm font-semibold text-ink">Creator workspace</h2><p className="mt-1 text-xs text-muted">Find a launch, review activity, then manage or share it below.</p></div><Link href="/launch" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-xs font-semibold text-white">New launch ↗</Link></div>
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div><dt className="text-xs text-muted">Your launches</dt><dd className="mt-1 text-lg font-semibold text-ink">{launches.length}</dd></div><div><dt className="text-xs text-muted">Indexed trades</dt><dd className="mt-1 text-lg font-semibold text-ink">{launches.reduce((n, l) => n + l.buys + l.sells, 0)}</dd></div><div><dt className="text-xs text-muted">24h volume · priced pools</dt><dd className="mt-1 text-lg font-semibold text-ink">{priced.length ? fmtUsd(volume, { compact: true }) : "—"}</dd></div></dl>
    {priced.length < launches.length && <p className="mt-2 text-[11px] text-muted">USD volume excludes {launches.length - priced.length} pool(s) without a USD price.</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="text-xs text-muted">Find your launch<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, symbol, address or network" className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink" /></label><label className="text-xs text-muted">Sort<select value={order} onChange={e => setOrder(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink"><option value="recent">Newest first</option><option value="activity">Most trades</option></select></label></div>
    <ul className="mt-3 divide-y divide-line">{sorted.slice(0, 8).map(l => <li key={`${l.chain}:${l.token}`} className="flex flex-wrap items-center justify-between gap-2 py-2"><Link href={`/t/${l.chain}/${l.token}`} className="inline-flex min-h-11 min-w-0 max-w-full flex-wrap items-center gap-2 break-all text-sm text-ink">{l.symbol}<span className="text-xs text-muted">{CHAIN_LABELS[l.chain]}</span></Link><span className="text-xs text-muted">{l.buys + l.sells} trades · {l.holders} indexed holders</span></li>)}</ul>
    {launches.length > 0 && !sorted.length ? <p className="mt-3 text-xs text-muted">No launches match your search.</p> : null}
    {sorted.length > 8 && <p className="mt-2 text-xs text-muted">Showing 8 of {sorted.length} matches. Refine your search to find another launch.</p>}
    {!launches.length && <p className="mt-3 text-sm text-muted">Your launches will appear here after your first token is indexed.</p>}
    <p className="mt-3 text-[11px] leading-relaxed text-muted">Profile editing is available in your wallet identity above. Token edits, sharing and beneficiary fee collection are in the Launches tab below. Activity reflects indexed data.</p>
  </section>;
}
