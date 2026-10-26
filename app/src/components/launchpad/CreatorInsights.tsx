"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  chainKeyOf,
  CHAIN_LABELS,
  explorerTx,
  type ChainKey,
} from "@/lib/chainPublic";
import type { LaunchRow, WalletTrade } from "@/lib/launchpad/queries";
import { csv } from "@/lib/launchpad/workspace-tools";
import { fmtQuote } from "@/lib/launchpad/math";
import { useTransactionJournal } from "./useTransactionJournal";
import DataFreshness from "./DataFreshness";
type Activity = {
  day: string;
  chain_id: number;
  token: string;
  trades: number;
  buys: number;
  quote_raw: string;
};
type Fee = {
  tx_hash: string;
  chain_id: number;
  token: string;
  kind: string;
  quote_amount: string;
  token_amount: string;
  block_time: string;
};
type Data = { activity: Activity[]; fees: Fee[]; asOf: number };
const button =
  "min-h-11 rounded-xl border border-line px-3 text-xs text-body hover:bg-raised disabled:opacity-40";
function download(name: string, rows: unknown[][]) {
  const u = URL.createObjectURL(
    new Blob([csv(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export default function CreatorInsights({
  wallet,
  launches,
  trades,
}: {
  wallet: string;
  launches: LaunchRow[];
  trades: WalletTrade[];
}) {
  const journal = useTransactionJournal(wallet);
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("all");
  const [network, setNetwork] = useState("");
  useEffect(() => {
    let active = true;
    const c = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/me/analytics?wallet=${wallet}`, {
        signal: AbortSignal.any([c.signal, AbortSignal.timeout(12000)]),
        cache: "no-store",
      })
        .then(async (r) => {
          if (!r.ok) throw Error();
          const d = await r.json();
          if (active) {
            setData(d);
            setFailed(false);
          }
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
      c.abort();
    };
  }, [wallet, attempt]);
  const token = (chain: ChainKey, address: string) =>
    launches.find(
      (l) =>
        l.chain === chain && l.token.toLowerCase() === address.toLowerCase(),
    );
  const days = [...new Set(data?.activity.map((a) => a.day) ?? [])]
    .sort()
    .reverse();
  const max = Math.max(
    1,
    ...days.map((day) =>
      data!.activity
        .filter((a) => a.day === day)
        .reduce((n, a) => n + a.trades, 0),
    ),
  );
  type Entry = {
    hash: string;
    chain: ChainKey;
    label: string;
    kind: string;
    state: string;
    at: number;
    source: string;
  };
  const map = new Map<string, Entry>();
  for (const l of launches)
    map.set(`${l.chain}:${l.tx_hash.toLowerCase()}`, {
      hash: l.tx_hash,
      chain: l.chain,
      label: `Launch ${l.symbol}`,
      kind: "launch",
      state: "confirmed",
      at: Date.parse(l.block_time),
      source: "Indexed",
    });
  for (const t of trades)
    map.set(`${t.chain}:${t.tx_hash.toLowerCase()}`, {
      hash: t.tx_hash,
      chain: t.chain,
      label: `${t.is_buy ? "Buy" : "Sell"} ${t.symbol}`,
      kind: "swap",
      state: "confirmed",
      at: Date.parse(t.block_time),
      source: "Indexed",
    });
  // Collections on your pools are pool events, not necessarily transactions sent by this wallet.
  for (const f of data?.fees ?? []) {
    const c = chainKeyOf(f.chain_id);
    if (c)
      map.set(`${c}:${f.tx_hash.toLowerCase()}`, {
        hash: f.tx_hash,
        chain: c,
        label: `Pool fees collected · ${token(c, f.token)?.symbol ?? f.token.slice(0, 8)}`,
        kind: "collect",
        state: "confirmed",
        at: Date.parse(f.block_time),
        source: "Your pool · indexed",
      });
  }
  for (const t of journal.rows) {
    const hash = t.replacementHash ?? t.hash;
    const k = `${t.chain}:${hash.toLowerCase()}`;
    const indexed = map.get(k);
    map.set(k, {
      hash,
      chain: t.chain,
      label: t.label,
      kind: t.kind,
      state:
        t.state === "replaced" ? "replaced" : indexed ? "confirmed" : t.state,
      at: t.createdAt,
      source: indexed ? "Browser + index" : "This browser",
    });
  }
  const history = [...map.values()]
    .filter(
      (t) =>
        (filter === "all" || t.kind === filter) &&
        (!network || t.chain === network),
    )
    .sort((a, b) => b.at - a.at);
  return (
    <div className="space-y-4">
      <section
        className="rounded-2xl border border-line bg-card p-4 sm:p-5"
        aria-label="Creator analytics"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">
            Creator analytics · last 30 days
          </h2>
          <button
            type="button"
            onClick={() => setAttempt((a) => a + 1)}
            className={button}
          >
            Refresh analytics
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Indexed activity across your launches, grouped by UTC day. Pool
          collections are gross fees, before beneficiary splits—not your
          personal earnings. Historical USD revenue is not inferred from today’s
          prices.
        </p>
        <DataFreshness
          at={data?.asOf ?? null}
          failed={failed}
          label="Analytics"
        />
        {failed && (
          <p role="alert" className="text-xs text-warm-ink">
            Analytics could not refresh. Retry above; any existing snapshot
            remains visible.
          </p>
        )}
        {data && (
          <>
            <div
              className="mt-4 max-h-64 space-y-2 overflow-auto"
              aria-label="Daily trade counts"
            >
              {days.length ? (
                days.map((day) => {
                  const total = data.activity
                    .filter((a) => a.day === day)
                    .reduce((n, a) => n + a.trades, 0);
                  return (
                    <div
                      key={day}
                      className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3 text-xs text-muted"
                    >
                      <span>{day}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-line">
                        <span
                          className="block h-full rounded-full bg-brand"
                          style={{ width: `${(total / max) * 100}%` }}
                        />
                      </span>
                      <span className="text-right font-mono text-body">
                        {total}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted">
                  No indexed activity in the last 30 days.
                </p>
              )}
            </div>
            <details className="mt-4 rounded-xl border border-line p-3">
              <summary className="min-h-11 cursor-pointer text-sm text-ink">
                Pool collection timeline · {data.fees.length} events
              </summary>
              <ul className="max-h-64 divide-y divide-line overflow-auto">
                {data.fees.map((f, i) => {
                  const c = chainKeyOf(f.chain_id);
                  const l = c ? token(c, f.token) : null;
                  return (
                    <li
                      key={`${f.chain_id}:${f.tx_hash}:${i}`}
                      className="py-3 text-xs text-body"
                    >
                      <p>
                        {f.block_time.slice(0, 10)} UTC ·{" "}
                        {l?.symbol ?? f.token.slice(0, 10)}
                      </p>
                      <p className="mt-1 break-words font-mono text-muted">
                        {l
                          ? `${fmtQuote(BigInt(f.quote_amount ?? "0"), l.quote_decimals, l.quote_symbol)} + ${fmtQuote(BigInt(f.token_amount ?? "0"), 18, l.symbol)}`
                          : "Export exact base units below"}
                      </p>
                    </li>
                  );
                })}
              </ul>
              {!data.fees.length && (
                <p className="text-xs text-muted">
                  No collection events indexed in this window.
                </p>
              )}
            </details>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={button}
                type="button"
                onClick={() =>
                  download("launch-activity-30d.csv", [
                    [
                      "UTC day",
                      "Network",
                      "Token",
                      "Trades",
                      "Buys",
                      "Sells",
                      "Quote volume",
                      "Quote asset",
                    ],
                    ...data.activity.map((a) => {
                      const c = chainKeyOf(a.chain_id);
                      const l = c ? token(c, a.token) : null;
                      return [
                        a.day,
                        c ?? a.chain_id,
                        l?.symbol ?? a.token,
                        a.trades,
                        a.buys,
                        a.trades - a.buys,
                        l
                          ? fmtQuote(BigInt(a.quote_raw), l.quote_decimals, "")
                          : a.quote_raw,
                        l?.quote_symbol ?? "raw base units",
                      ];
                    }),
                  ])
                }
              >
                Export activity CSV
              </button>
              <button
                className={button}
                type="button"
                onClick={() =>
                  download("launch-pool-collections-30d.csv", [
                    [
                      "Time UTC",
                      "Chain ID",
                      "Token",
                      "Quote base units",
                      "Token base units",
                      "Transaction",
                    ],
                    ...data.fees.map((f) => [
                      f.block_time,
                      f.chain_id,
                      f.token,
                      f.quote_amount,
                      f.token_amount,
                      f.tx_hash,
                    ]),
                  ])
                }
              >
                Export pool fees CSV
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Reports cover up to 3,000 daily token rows and 300 recent
              collection events. Fee exports use exact base units. Consult
              network status for indexing delays.
            </p>
          </>
        )}
      </section>
      <section
        className="rounded-2xl border border-line bg-card p-4 sm:p-5"
        aria-label="Unified transaction history"
      >
        <h2 className="text-sm font-semibold text-ink">Transaction history</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Indexed launches and recent trades, pool collections, and transactions
          saved in this browser. Approvals sent elsewhere are not included. A
          replacement or cancellation is not a completed original action.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="text-xs text-muted">
            Type
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="ml-2 min-h-11 rounded-xl border border-line bg-paper px-3 text-ink"
            >
              {["all", "launch", "swap", "approval", "collect"].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Network
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="ml-2 min-h-11 rounded-xl border border-line bg-paper px-3 text-ink"
            >
              <option value="">All</option>
              <option value="base">Base</option>
              <option value="robinhood">Robinhood Chain</option>
              <option value="arc">Arc</option>
            </select>
          </label>
          <button
            className={button}
            type="button"
            onClick={() =>
              download("launch-transactions.csv", [
                [
                  "Time UTC",
                  "Network",
                  "Action",
                  "Status",
                  "Source",
                  "Transaction",
                ],
                ...history.map((t) => [
                  new Date(t.at).toISOString(),
                  t.chain,
                  t.label,
                  t.state,
                  t.source,
                  t.hash,
                ]),
              ])
            }
          >
            Export history CSV
          </button>
        </div>
        <ul className="mt-3 max-h-96 divide-y divide-line overflow-auto">
          {history.map((t) => (
            <li
              key={`${t.chain}:${t.hash}`}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="break-words text-sm text-ink">{t.label}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {CHAIN_LABELS[t.chain]} · {t.state} · {t.source} ·{" "}
                  {new Date(t.at).toISOString().slice(0, 16).replace("T", " ")}{" "}
                  UTC
                </p>
              </div>
              <a
                className="inline-flex min-h-11 items-center text-xs text-brand"
                href={explorerTx(t.chain, t.hash)}
                target="_blank"
                rel="noreferrer"
              >
                {t.hash.slice(0, 10)}… ↗
              </a>
            </li>
          ))}
        </ul>
        {!history.length && (
          <p className="py-4 text-sm text-muted">
            No matching transactions in this history window.
          </p>
        )}
        <Link
          href="/status"
          className="inline-flex min-h-11 items-center text-xs text-muted underline"
        >
          Check indexing status
        </Link>
      </section>
    </div>
  );
}
