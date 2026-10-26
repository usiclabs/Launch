"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ALERT_KEY,
  parseAlerts,
  targetReached,
  type PriceAlert,
} from "@/lib/launchpad/price-alerts";
import { useWatchlist } from "./useWatchlist";
import type { WatchlistData } from "@/lib/launchpad/watchlistData";
import type { HealthBody } from "@/lib/health";
import { toast } from "./TxToasts";
import { CHAIN_LABELS } from "@/lib/chainPublic";
function save(alerts: PriceAlert[]) {
  localStorage.setItem(ALERT_KEY, JSON.stringify(alerts));
  window.dispatchEvent(new Event(ALERT_KEY));
}
/** One global runner; no polling, permissions, or network requests until a user creates a rule. */
export function PriceAlertRunner() {
  useEffect(() => {
    let busy = false;
    let active = true;
    let controller: AbortController | null = null;
    async function check() {
      if (busy || document.hidden) return;
      const rules = parseAlerts(localStorageSafe()).filter((a) => !a.firedAt);
      if (!rules.length) return;
      busy = true;
      controller = new AbortController();
      const deadline = setTimeout(() => controller?.abort(), 12000);
      try {
        const unique = [
          ...new Map(
            rules.map((a) => [
              `${a.chain}:${a.token.toLowerCase()}`,
              { chain: a.chain, token: a.token, since: null },
            ]),
          ).values(),
        ];
        const [r, h] = await Promise.all([
          fetch("/api/launch/watchlist", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ items: unique }),
            signal: controller.signal,
          }),
          fetch("/api/health", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);
        if (!r.ok || !h.ok) throw Error();
        const data: WatchlistData = await r.json();
        const health: HealthBody = await h.json();
        if (!active || document.hidden || !data.indexed) return;
        const current = parseAlerts(localStorageSafe());
        let changed = false;
        for (const a of current) {
          const row = data.items.find(
            (i) =>
              i.chain === a.chain &&
              i.token.toLowerCase() === a.token.toLowerCase(),
          )?.launch;
          const status = health.chains.find((c) => c.chain === a.chain);
          const value = row
            ? a.metric === "price"
              ? row.price_usd
              : row.fdv_usd
            : null;
          const healthy =
            !!status &&
            !status.delayed &&
            !!status.last_run_at &&
            Date.now() - Date.parse(status.last_run_at) < 600000;
          if (targetReached(a, value ?? null, healthy)) {
            a.firedAt = Date.now();
            changed = true;
            toast({
              kind: "info",
              title: `${a.symbol} alert reached`,
              sub: `Indexed ${a.metric === "price" ? "price" : "market cap"} ${a.direction} $${a.target}. Open Alerts to review.`,
              chain: a.chain,
              token: a.token,
              symbol: a.symbol,
            });
          }
        }
        if (changed) save(current);
      } catch {
        /* Retain rules; a failed or stale read cannot trigger an alert. */
      } finally {
        clearTimeout(deadline);
        busy = false;
      }
    }
    const initial = setTimeout(() => void check(), 0);
    const interval = setInterval(() => void check(), 60000);
    const run = () => void check();
    window.addEventListener(ALERT_KEY, run);
    document.addEventListener("visibilitychange", run);
    return () => {
      active = false;
      clearTimeout(initial);
      clearInterval(interval);
      controller?.abort();
      window.removeEventListener(ALERT_KEY, run);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);
  return null;
}
function localStorageSafe() {
  try {
    return localStorage.getItem(ALERT_KEY);
  } catch {
    return null;
  }
}
export default function PriceAlerts() {
  const watch = useWatchlist();
  const [rules, setRules] = useState<PriceAlert[]>([]);
  const [token, setToken] = useState("");
  const [metric, setMetric] = useState<"price" | "mcap">("mcap");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    const read = () => setRules(parseAlerts(localStorageSafe()));
    const timer = setTimeout(read, 0);
    window.addEventListener(ALERT_KEY, read);
    window.addEventListener("storage", read);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(ALERT_KEY, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  function persist(next: PriceAlert[]) {
    try {
      save(next);
      setRules(next);
      setNote("Alert settings saved in this browser.");
    } catch {
      setNote("Browser storage is blocked. Alerts could not be saved.");
    }
  }
  const input =
    "mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink";
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">
        Your watchlist. Your signals.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Create up to 10 one-time USD price or market-cap alerts for saved
        tokens. Checked about once a minute while LAUNCH is open and visible. No
        push notifications or background delivery. Alerts pause when indexing is
        delayed or USD pricing is unavailable.
      </p>
      <form
        className="mt-5 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const entry = watch.entries.find(
            (e) => `${e.chain}:${e.token}` === token,
          );
          const n = Number(target);
          if (!entry || !Number.isFinite(n) || n <= 0 || rules.length >= 10) {
            setNote(
              "Choose a watched token and a positive target. Maximum 10 rules.",
            );
            return;
          }
          persist([
            ...rules,
            {
              id: crypto.randomUUID(),
              chain: entry.chain,
              token: entry.token,
              symbol: entry.symbol,
              metric,
              direction,
              target: n,
              firedAt: null,
            },
          ]);
        }}
      >
        <label className="text-xs text-muted">
          Watched token
          <select
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className={input}
          >
            <option value="">Choose a token</option>
            {watch.entries.map((t) => (
              <option
                key={`${t.chain}:${t.token}`}
                value={`${t.chain}:${t.token}`}
              >
                {t.symbol} · {CHAIN_LABELS[t.chain]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Metric
          <select
            className={input}
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
          >
            <option value="mcap">Market cap · USD estimate</option>
            <option value="price">Token price · USD estimate</option>
          </select>
        </label>
        <label className="text-xs text-muted">
          Condition
          <select
            className={input}
            value={direction}
            onChange={(e) => setDirection(e.target.value as typeof direction)}
          >
            <option value="above">At or above</option>
            <option value="below">At or below</option>
          </select>
        </label>
        <label className="text-xs text-muted">
          Target · USD
          <input
            required
            type="number"
            min="0"
            step="any"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={input}
          />
        </label>
        <button
          className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-40 sm:col-span-2"
          disabled={!watch.ready || !watch.entries.length || rules.length >= 10}
        >
          Create alert
        </button>
      </form>
      {!watch.entries.length && (
        <p className="mt-3 text-sm text-muted">
          Save a token with its Watch button first.{" "}
          <Link href="/" className="underline">
            Explore launches
          </Link>
        </p>
      )}
      <p role="status" className="mt-3 text-xs text-muted">
        {note}
      </p>
      <ul className="mt-4 divide-y divide-line">
        {rules.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div>
              <Link
                href={`/t/${a.chain}/${a.token}`}
                className="text-sm font-semibold text-ink"
              >
                {a.symbol} ↗
              </Link>
              <p className="mt-1 text-xs text-muted">
                {CHAIN_LABELS[a.chain]} ·{" "}
                {a.metric === "price" ? "Price" : "Market cap"} {a.direction} $
                {a.target} · {a.firedAt ? "Triggered" : "Armed"}
              </p>
            </div>
            <div className="flex gap-3">
              {a.firedAt && (
                <button
                  type="button"
                  className="min-h-11 text-xs text-brand"
                  onClick={() =>
                    persist(
                      rules.map((r) =>
                        r.id === a.id ? { ...r, firedAt: null } : r,
                      ),
                    )
                  }
                >
                  Rearm
                </button>
              )}
              <button
                type="button"
                aria-label={`Remove ${a.symbol} alert`}
                className="min-h-11 text-xs text-muted"
                onClick={() => persist(rules.filter((r) => r.id !== a.id))}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/status"
        className="inline-flex min-h-11 items-center text-xs text-muted underline"
      >
        Check network status
      </Link>
      <p className="text-xs leading-relaxed text-muted">
        A threshold can trigger on the first healthy check if it is already met.
        A market-cap alert does not measure available liquidity or predict
        returns. Multiple open tabs may show the same alert.
      </p>
    </section>
  );
}
