"use client";
import styles from "./WorkspacePolish.module.css";
import { useRef, useState } from "react";
import Link from "next/link";
const topics = [
  [
    "Launching a token",
    "A launch creates your token and Uniswap v4 pool in one transaction. The launch allocates 100% of supply to the pool and permanently locks its liquidity position. LAUNCH charges no platform launch fee; network gas still applies.",
  ],
  [
    "Locked liquidity",
    "The original liquidity position cannot be withdrawn by the creator or LAUNCH. This does not prevent selling, price declines or thin market depth. A market cap is not cash available to withdraw.",
  ],
  [
    "Trading fees and creator fees",
    "The chosen pool trading fee is fixed at launch. Fee routing determines who receives collected fees or whether they are burned. Fee collection does not unlock the liquidity position. Gas can apply even when the platform fee is zero.",
  ],
  [
    "Approvals and spending permissions",
    "ERC-20 trading can require approval to Permit2 and a router allowance. Review the current trade confirmation for scope and duration. Rejecting a later swap does not revoke an earlier approval. Native-currency payments normally do not require token approval.",
  ],
  [
    "Slippage and price impact",
    "Price impact is the effect of your trade on pool price. Slippage is your allowed difference from the quoted output. Raising slippage permits worse execution and is not a guaranteed solution to a failed trade.",
  ],
  [
    "Pending transactions and RPC timeouts",
    "Check your wallet activity, saved transaction history and explorer record before retrying. A timeout does not prove failure. A confirmed revert can still cost gas. Reloading LAUNCH does not cancel an onchain transaction.",
  ],
  [
    "Images, banners and metadata edits",
    "Token artwork and descriptions are offchain metadata. Creators can preview edits before signing. Token name, symbol and permanent launch settings cannot be changed through the metadata editor.",
  ],
  [
    "Watchlist alerts and saved views",
    "Alerts are checked while LAUNCH is open and visible; they pause for delayed indexing or unavailable USD prices. Saved views store filters, not someone else’s private watchlist. Browser-local data does not automatically transfer to another device.",
  ],
  [
    "Networks and balances",
    "A balance on one network does not pay gas on another. Check the token contract and network before trading. Arc is listed as coming soon; use only networks enabled in the current interface.",
  ],
  [
    "Creator launch kit",
    "Open Share on a token page, then Creator launch kit. Edit and copy an announcement or download token facts and the QR image. Draft edits publish nothing and do not change metadata.",
  ],
];
export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }
  const hits = topics.filter((t) =>
    t.join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div
      className={`${styles.surface} rounded-3xl border border-line p-5 sm:p-8`}
    >
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-brand">
        LAUNCH essentials
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        A little clarity goes a long way.
      </h1>
      <p className="mt-3 text-sm text-muted">
        Practical answers about launching, trading and managing your experience.
      </p>
      <label className="mt-6 block text-xs text-muted">
        Search help
        <input
          ref={searchRef}
          type="search"
          aria-controls="help-results"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try approvals, fees or pending"
          className="mt-2 min-h-12 w-full rounded-xl border border-line bg-card px-4 text-sm text-ink"
        />
      </label>
      {!query && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Popular help searches"
        >
          {["Launching", "Fees", "Approvals", "Pending"].map((term) => (
            <button
              key={term}
              type="button"
              className={styles.searchChip}
              onClick={() => {
                setQuery(term);
                searchRef.current?.focus();
              }}
            >
              {term}
            </button>
          ))}
        </div>
      )}
      <div className="my-3 flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-xs text-muted">
          {hits.length} {hits.length === 1 ? "topic" : "topics"}
        </p>
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="min-h-11 text-xs font-medium text-brand"
          >
            Clear search
          </button>
        )}
      </div>
      <div id="help-results" className="space-y-3">
        {hits.map(([title, body]) => (
          <details
            key={title}
            className={`${styles.disclosure} border border-line p-4`}
          >
            <summary className="min-h-11 cursor-pointer text-sm font-semibold text-ink">
              {title}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-body">{body}</p>
          </details>
        ))}
      </div>
      {!hits.length && (
        <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center">
          <p className="text-sm font-medium text-ink">
            No matching topics yet.
          </p>
          <p className="mt-2 text-sm text-muted">
            Try a shorter phrase, or browse all ten topics.
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className={styles.searchChip}
          >
            Browse all topics
          </button>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-body">
        <Link
          className="inline-flex min-h-11 items-center underline"
          href="/status"
        >
          Network status
        </Link>
        <Link
          className="inline-flex min-h-11 items-center underline"
          href="/rules"
        >
          Launch mechanics & contracts
        </Link>
        <Link
          className="inline-flex min-h-11 items-center underline"
          href="/preferences"
        >
          Display preferences
        </Link>
      </div>
    </div>
  );
}
