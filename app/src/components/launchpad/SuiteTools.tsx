"use client";
import styles from "./WorkspacePolish.module.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sheet from "@/components/Sheet";
import {
  CHAIN_LABELS,
  explorerAddress,
  type ChainKey,
} from "@/lib/chainPublic";
const input =
  "min-h-11 rounded-xl border border-line bg-paper px-3 text-sm text-ink";
const button =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-3 text-xs text-body hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 transition-colors motion-reduce:transition-none";
export function VerificationDrawer({
  chain,
  token,
  quote,
  factory,
  locker,
}: {
  chain: ChainKey;
  token: string;
  quote: string;
  factory: string | null;
  locker: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={button} onClick={() => setOpen(true)}>
        Verify token
      </button>
      {open && (
        <Sheet title="Verify this token" onClose={() => setOpen(false)}>
          <p className="text-sm leading-relaxed text-muted">
            Names and symbols can be copied. Check the network and full contract
            addresses before trading. These links identify contracts; they do
            not guarantee token value or safety.
          </p>
          <dl className="mt-4 divide-y divide-line">
            <div className="py-3">
              <dt className="text-xs text-muted">Network</dt>
              <dd className="mt-1 text-sm text-ink">{CHAIN_LABELS[chain]}</dd>
            </div>
            {[
              ["Token", token],
              ["Pair token", quote],
              ["Factory", factory],
              ["Liquidity locker", locker],
            ].map(([label, address]) => (
              <div key={label} className="py-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-1 break-all font-mono text-xs text-ink">
                  {address ? (
                    address === "0x0000000000000000000000000000000000000000" ? (
                      "Native currency (no ERC-20 contract)"
                    ) : (
                      <a
                        href={explorerAddress(chain, address)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 max-w-full items-center underline [overflow-wrap:anywhere]"
                      >
                        {address} ↗
                      </a>
                    )
                  ) : (
                    "Not configured"
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <Link className={button} href="/help">
            Understand launch mechanics
          </Link>
        </Sheet>
      )}
    </>
  );
}
export function SavedViews({
  selection,
  view,
}: {
  selection: {
    sort: string;
    window: string;
    chain: string | null;
    filter: string | null;
  };
  view: string;
}) {
  const [rows, setRows] = useState<{ name: string; url: string }[]>([]);
  const [name, setName] = useState("");
  const [removed, setRemoved] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [note, setNote] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const d = JSON.parse(localStorage.getItem("launch:views:v1") ?? "[]");
        if (Array.isArray(d))
          setRows(
            d
              .filter(
                (x) =>
                  x != null &&
                  typeof x === "object" &&
                  typeof x.name === "string" &&
                  x.name.length <= 50 &&
                  typeof x.url === "string" &&
                  x.url.startsWith("/?") &&
                  x.url.length < 500,
              )
              .slice(0, 10),
          );
      } catch {
        setNote("Saved views could not be read.");
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const p = new URLSearchParams({
    sort: selection.sort,
    window: selection.window,
    chain: selection.chain ?? "",
    filter: selection.filter ?? "",
    view,
  });
  const url = `/?${p}#launches`;
  function save(next: typeof rows) {
    setRows(next);
    try {
      localStorage.setItem("launch:views:v1", JSON.stringify(next));
      setNote("Saved on this device.");
      return true;
    } catch {
      setNote(
        "Storage is blocked. Changes apply only for this visit. Copy the view link to keep it.",
      );
      return false;
    }
  }
  return (
    <details
      className={`${styles.disclosure} m-3 border border-line p-3 sm:m-4`}
    >
      <summary className="min-h-11 cursor-pointer text-xs font-medium text-body">
        Saved discovery views
      </summary>
      <p className="mb-3 text-xs text-muted">
        Save the current network, sort, volume window, pairing filter and
        market/watchlist view. Search text is not saved. Watchlist contents
        remain private to your device.
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const label = name.trim() || "My discovery view";
          save(
            [
              { name: label, url },
              ...rows.filter((r) => r.name !== label),
            ].slice(0, 10),
          );
          setName("");
          setRemoved(null);
        }}
      >
        <input
          aria-label="Discovery view name"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this view"
          className={`${input} min-w-0 flex-1`}
        />
        <button type="submit" className={button}>
          Save view
        </button>
        <button
          type="button"
          className={button}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                new URL(url, location.origin).href,
              );
              setNote("View link copied.");
            } catch {
              setNote(
                `Copy this view link: ${new URL(url, location.origin).href}`,
              );
            }
          }}
        >
          Copy view link
        </button>
      </form>
      {!rows.length && (
        <p className="mt-3 text-xs text-muted">
          No saved views yet. Save this setup to return to it later.
        </p>
      )}
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li
            key={r.name}
            className="flex flex-wrap justify-between gap-2 py-2"
          >
            <a
              href={r.url}
              className={`${button} max-w-full min-w-0 break-all text-left`}
            >
              {r.name} ↗
            </a>
            <button
              type="button"
              aria-label={`Remove view ${r.name}`}
              className={button}
              onClick={() => {
                setRemoved(r);
                if (save(rows.filter((x) => x.name !== r.name))) {
                  setNote(`Removed “${r.name}”.`);
                }
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {removed && (
        <button
          type="button"
          className={`${button} mt-2`}
          onClick={() => {
            const persisted = save(
              [removed, ...rows.filter((r) => r.name !== removed.name)].slice(
                0,
                10,
              ),
            );
            setRemoved(null);
            if (persisted) setNote("View restored.");
          }}
        >
          Undo removal
        </button>
      )}
      <p
        role="status"
        className={`${styles.status} mt-2 break-all text-xs text-muted`}
      >
        {note}
      </p>
    </details>
  );
}
export function Preferences() {
  const [chain, setChain] = useState("base");
  const [interval, setInterval] = useState("auto");
  const [note, setNote] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const d = JSON.parse(localStorage.getItem("launch:display:v1") ?? "{}");
        if (!d || typeof d !== "object") return;
        if (["base", "robinhood"].includes(d.chain)) setChain(d.chain);
        if (["auto", "1m", "5m", "15m", "1h", "4h", "1d"].includes(d.interval))
          setInterval(d.interval);
      } catch {
        setNote("Preferences could not be read.");
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <section
      className={`${styles.surface} rounded-3xl border border-line p-5 sm:p-8`}
    >
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-brand">
        Your workspace
      </p>
      <h1 className="text-2xl font-semibold text-ink">
        Make LAUNCH feel familiar.
      </h1>
      <p className="mt-3 text-sm text-muted">
        Display defaults only. These settings never connect or switch your
        wallet, set a spending amount, or submit a transaction. Explicit network
        links take precedence.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-muted">
          Preferred launch network
          <select
            aria-label="Preferred launch network"
            aria-describedby="preferred-network-hint"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className={`${input} mt-1 block w-full`}
          >
            <option value="base">Base</option>
            <option value="robinhood">Robinhood Chain</option>
          </select>
          <span
            id="preferred-network-hint"
            className="mt-2 block leading-relaxed"
          >
            Preselects the network on a new launch form.
          </span>
        </label>
        <label className="text-xs text-muted">
          Default chart interval
          <select
            aria-label="Default chart interval"
            aria-describedby="chart-interval-hint"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className={`${input} mt-1 block w-full`}
          >
            {["auto", "1m", "5m", "15m", "1h", "4h", "1d"].map((i) => (
              <option key={i} value={i}>
                {
                  {
                    auto: "Automatic by token age",
                    "1m": "1 minute",
                    "5m": "5 minutes",
                    "15m": "15 minutes",
                    "1h": "1 hour",
                    "4h": "4 hours",
                    "1d": "1 day",
                  }[i]
                }
              </option>
            ))}
          </select>
          <span id="chart-interval-hint" className="mt-2 block leading-relaxed">
            Sets the starting view when you open a token chart.
          </span>
        </label>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className={`${button} !border-transparent bg-brand !text-white hover:brightness-110`}
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(
                "launch:display:v1",
                JSON.stringify({ chain, interval }),
              );
              document.cookie = `launch_preferred_chain=${chain}; path=/; max-age=31536000; samesite=lax`;
              setNote(
                "Saved. Defaults apply when opening a new launch form or chart.",
              );
            } catch {
              setNote("Storage is blocked; preferences were not saved.");
            }
          }}
        >
          Save preferences
        </button>
        <button
          className={button}
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem("launch:display:v1");
              document.cookie =
                "launch_preferred_chain=; path=/; max-age=0; samesite=lax";
              setChain("base");
              setInterval("auto");
              setNote(
                "Display defaults reset. Your wallet, drafts and watchlist are unchanged.",
              );
            } catch {
              setNote("Could not reset browser storage.");
            }
          }}
        >
          Reset defaults
        </button>
      </div>
      <p role="status" className={`${styles.status} mt-3 text-xs text-muted`}>
        {note}
      </p>
    </section>
  );
}
