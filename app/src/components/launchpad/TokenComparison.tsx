"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CHAIN_LABELS, type ChainKey } from "@/lib/chainPublic";
import { compareQuery, parseCompareKeys, type CompareKey } from "@/lib/launchpad/compare";
import { fmtCompact, fmtPrice, fmtUsd, fdvForStartTick } from "@/lib/launchpad/math";
import type { LaunchRow } from "@/lib/launchpad/queries";
import DataFreshness from "./DataFreshness";
import TokenAvatar from "./TokenAvatar";

const id = (k: CompareKey) => `${k.chain}:${k.token.toLowerCase()}`;
const dollars = (n: number | null) => n === null ? "Not priced in USD" : fmtUsd(n, { compact: true });
export default function TokenComparison({ initial }: { initial: CompareKey[] }) {
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<ChainKey | "">("");
  const [hits, setHits] = useState<LaunchRow[]>([]);
  const [searching, setSearching] = useState(true);
  const [searchError, setSearchError] = useState(false);
  const [snapshot, setSnapshot] = useState<{ key: string; rows: LaunchRow[]; at: number; missing: number } | null>(null);
  const [failure, setFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [copyNote, setCopyNote] = useState("");
  const key = compareQuery(selected);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true); setSearchError(false); setHits([]);
      const deadline = setTimeout(() => controller.abort(), 12000);
      try {
        const params = new URLSearchParams({ q: query, chain });
        const endpoint = query.trim() ? `/api/launch/search?${params}` : `/api/launch/list?${new URLSearchParams({ sort: "new", limit: "20", chain })}`;
        const r = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        if (!r.ok) throw new Error("Search unavailable");
        const data = await r.json();
        if (!controller.signal.aborted) setHits(data.launches ?? []);
      } catch { if (active) { setHits([]); setSearchError(true); } }
      finally { clearTimeout(deadline); if (active) setSearching(false); }
    }, 250);
    return () => { clearTimeout(timer); active = false; controller.abort(); };
  }, [query, chain, attempt]);
  useEffect(() => {
    if (!key) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setFailure(false);
      const deadline = setTimeout(() => controller.abort(), 12000);
      try {
        const r = await fetch(`/api/launch/compare?${new URLSearchParams({ tokens: key })}`, { cache: "no-store", signal: controller.signal });
        if (!r.ok) throw new Error("Comparison unavailable");
        const data = await r.json();
        if (!controller.signal.aborted) setSnapshot({ key, rows: data.launches, at: data.asOf, missing: data.missing.length });
      } catch { if (active) setFailure(true); }
      finally { clearTimeout(deadline); if (active) setLoading(false); }
    }, 0);
    return () => { clearTimeout(timer); active = false; controller.abort(); };
  }, [key, attempt]);
  useEffect(() => {
    const restore = () => {
      setSelected(parseCompareKeys(new URLSearchParams(window.location.search).get("tokens") ?? ""));
      setCopyNote("");
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  async function copyComparison() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyNote("Comparison link copied.");
    } catch {
      setCopyNote("Copy this page’s URL from your browser.");
    }
  }
  function choose(next: CompareKey[]) {
    setSelected(next); setCopyNote(""); setFailure(false); setLoading(false);
    const tokens = compareQuery(next);
    window.history.replaceState(null, "", `/compare${tokens ? `?${new URLSearchParams({ tokens })}` : ""}`);
  }
  const rows = snapshot?.key === key ? snapshot.rows : [];
  const metrics: [string, (l: LaunchRow) => string][] = [
    ["Network", l => CHAIN_LABELS[l.chain]], ["Pair token", l => l.quote_symbol],
    ["Trading fee", l => `${l.lp_fee / 10000}%`], ["Platform launch fee", () => "None · network gas applies"],
    ["Token supply", l => fmtCompact(Number(l.supply) / 1e18)],
    ["Starting market cap · pair units", l => `${fmtCompact(fdvForStartTick(l.start_tick, l.quote_decimals))} ${l.quote_symbol}`],
    ["Current market cap · USD estimate", l => dollars(l.fdv_usd)],
    ["Current price · pair units", l => `${fmtPrice(l.price_quote)} ${l.quote_symbol}`],
    ["24h volume · USD estimate", l => dollars(l.volume_24h_usd)],
    ["Indexed holders", l => String(l.holders)], ["Indexed trades", l => String(l.buys + l.sells)],
    ["Liquidity position", () => "Permanently locked"], ["Supply allocated at launch", () => "100% to the pool"],
    ["Launched", l => new Date(l.block_time).toLocaleDateString()],
  ];
  return <div className="space-y-5">
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5" aria-label="Choose tokens">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]"><label className="text-xs text-muted">Find a token<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, symbol or contract address" className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink" /></label><label className="text-xs text-muted">Network<select value={chain} onChange={e => setChain(e.target.value as ChainKey | "")} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink"><option value="">All live networks</option><option value="base">Base</option><option value="robinhood">Robinhood Chain</option></select></label></div>
      <p role="status" className="mt-3 text-xs text-muted">{searchError ? "Search unavailable. Please retry." : searching ? "Finding tokens…" : `${hits.length} results · ${selected.length} of 3 selected`}</p>
      {searchError ? <button type="button" onClick={() => setAttempt(a => a + 1)} className="min-h-11 text-xs text-brand">Retry search</button> : null}
      <ul className="mt-2 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">{hits.map(l => <li key={id(l)}><button type="button" disabled={selected.some(s => id(s) === id(l)) || selected.length >= 3} onClick={() => choose([...selected, { chain: l.chain, token: l.token }])} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"><TokenAvatar chain={l.chain} token={l.token} symbol={l.symbol} image={l.image_url} size={28} className="rounded-lg" /><span className="min-w-0 flex-1"><span className="block truncate text-sm text-ink">{l.name} · {l.symbol}</span><span className="text-[11px] text-muted">{CHAIN_LABELS[l.chain]}</span></span><span className="shrink-0 text-xs text-brand">{selected.some(s => id(s) === id(l)) ? "Added" : selected.length >= 3 ? "Limit reached" : "Add"}</span></button></li>)}</ul>
      {!searching && !searchError && !hits.length ? <p className="mt-3 text-xs text-muted">No tokens found. Try a symbol or exact contract address.</p> : null}
    </section>
    {selected.length > 0 ? <div className="flex flex-wrap items-center gap-2">{selected.map(s => <button type="button" key={id(s)} onClick={() => choose(selected.filter(k => id(k) !== id(s)))} className="min-h-11 rounded-full border border-line px-3 text-xs text-ink" aria-label={`Remove ${s.token} on ${CHAIN_LABELS[s.chain]}`}>{rows.find(l => id(l) === id(s))?.symbol ?? `${s.token.slice(0, 8)}…`} · {CHAIN_LABELS[s.chain]} ×</button>)}<button type="button" onClick={() => void copyComparison()} className="min-h-11 px-3 text-xs text-brand">Copy comparison link</button><button type="button" disabled={loading} onClick={() => setAttempt(a => a + 1)} className="min-h-11 px-3 text-xs text-muted">Refresh</button><span role="status" className="text-xs text-muted">{copyNote}</span></div> : <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">Choose two or three tokens to compare. One token also works as a quick facts view.</p>}
    {key && loading ? <p role="status" className="text-sm text-muted">Loading comparison…</p> : null}
    {key && failure ? <p role="alert" className="text-sm text-warm-ink">Comparison could not refresh. Try Refresh. Any displayed data is the last loaded snapshot.</p> : null}
    {key && snapshot?.key === key && snapshot.missing > 0 ? <p className="text-xs text-warm-ink">{snapshot.missing} selected token(s) could not be found in the current index. Remove it or try refreshing later.</p> : null}
    {rows.length > 0 && <><DataFreshness at={snapshot?.at ?? null} failed={failure} label="Comparison" /><p className="text-[11px] text-muted sm:hidden">Swipe across the table to see every token.</p><div className="overflow-x-auto rounded-2xl border border-line bg-card" tabIndex={0} role="region" aria-label="Token comparison table"><table className="w-full min-w-[600px] text-sm"><caption className="sr-only">Token settings and indexed market activity</caption><thead><tr><th scope="col" className="sticky left-0 z-10 bg-card p-4 text-left text-xs text-muted">Compare facts</th>{rows.map(l => <th scope="col" key={id(l)} className="min-w-44 p-4 text-left font-semibold text-ink"><Link href={`/t/${l.chain}/${l.token}`} className="underline underline-offset-4">{l.symbol} ↗</Link><span className="mt-1 block max-w-52 break-words text-xs font-normal text-muted">{l.name}</span></th>)}</tr></thead><tbody>{metrics.map(([label, render]) => <tr key={label} className="border-t border-line"><th scope="row" className="sticky left-0 z-10 max-w-40 bg-card p-4 text-left text-xs font-normal text-muted">{label}</th>{rows.map(l => <td key={id(l)} className="p-4 text-xs leading-relaxed text-body">{render(l)}</td>)}</tr>)}</tbody></table></div></>}
    <p className="text-xs leading-relaxed text-muted">Market cap and volume are estimates from indexed data, not cash available to withdraw. A permanently locked position does not guarantee liquidity depth or token value. USD figures are unavailable when the pair token has no reliable USD price. <Link href="/status" className="underline underline-offset-4">Check indexing status.</Link></p>
  </div>;
}
