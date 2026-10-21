"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowUpRight, History } from "lucide-react";
import { CHAIN_SHORT } from "@/lib/chainPublic";
import type { RecentToken } from "@/lib/launchpad/browser-history";
import { clearRecentTokens, rememberToken, useRecentTokens } from "./useBrowserHistory";
import TokenAvatar from "./TokenAvatar";

export function RecordTokenVisit({ chain, token, name, symbol, image }: Omit<RecentToken, "viewedAt">) {
  useEffect(() => rememberToken({ chain, token, name, symbol, image }), [chain, token, name, symbol, image]);
  return null;
}

export default function RecentTokens() {
  const history = useRecentTokens();
  if (!history.ready || !history.items.length) return null;
  return (
    <section
      aria-labelledby="recent-tokens-heading"
      className="min-w-0 rounded-2xl border border-line bg-card px-4 pb-4 pt-2 sm:px-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-tokens-heading" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <History size={15} aria-hidden="true" />
          Recently viewed
        </h2>
        <button type="button" onClick={clearRecentTokens} className="min-h-11 text-xs text-muted hover:text-ink">
          Clear history
        </button>
      </div>
      <ul className="flex gap-2 overflow-x-auto pb-1 bb-scroll" aria-label="Recently viewed tokens">
        {history.items.map((item) => (
          <li key={`${item.chain}:${item.token}`} className="w-48 shrink-0">
            <Link
              href={`/t/${item.chain}/${item.token}`}
              className="group flex min-h-16 items-center gap-2.5 rounded-xl border border-line bg-paper px-3 py-2 transition-colors hover:border-line-strong motion-reduce:transition-none"
            >
              <TokenAvatar
                chain={item.chain}
                token={item.token}
                symbol={item.symbol}
                image={item.image}
                size={32}
                className="shrink-0 rounded-lg"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-ink">{item.name}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted">
                  {item.symbol} · {CHAIN_SHORT[item.chain]}
                </span>
              </span>
              <ArrowUpRight size={12} className="shrink-0 text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-muted">
        {history.storageError
          ? "Browser storage is unavailable. History lasts for this visit."
          : "Private to this browser. Clear it anytime."}
      </p>
    </section>
  );
}
