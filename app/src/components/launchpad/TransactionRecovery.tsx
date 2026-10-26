"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { getPublicClient } from "wagmi/actions";
import { useConfig } from "wagmi";
import { parseEventLogs } from "viem";
import { CHAINS, CHAIN_LABELS, explorerTx, type ChainKey } from "@/lib/chainPublic";
import { LAUNCH_FACTORY_ABI } from "@/lib/launchpad/abi";
import { launchpad } from "@/lib/launchpad/config";
import { settleTransaction, type SavedTransaction } from "@/lib/launchpad/transaction-journal";
import { useTransactionJournal } from "./useTransactionJournal";
import { btn } from "@/components/ui";

/** Receipt checks only. This component never accesses a wallet client or submits transactions. */
export default function TransactionRecovery({ wallet, chain, pendingOnly = false }: { wallet?: string; chain?: ChainKey; pendingOnly?: boolean }) {
  const journal = useTransactionJournal(wallet);
  const config = useConfig();
  const lock = useRef(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const rows = journal.rows.filter(r => (!chain || r.chain === chain) && (!pendingOnly || r.state === "pending")).slice(0, 8);
  async function check(tx: SavedTransaction) {
    if (lock.current) return;
    lock.current = true; setBusy(tx.hash); setMessage("");
    try {
      const pub = getPublicClient(config, { chainId: CHAINS[tx.chain].id });
      if (!pub) throw new Error("Network unavailable");
      let replacementReason = "";
      const rc = await pub.waitForTransactionReceipt({ hash: tx.hash, timeout: 15_000, onReplaced: ({ reason }) => { replacementReason = reason; } });
      if (replacementReason === "cancelled" || replacementReason === "replaced") {
        settleTransaction(tx.chain, tx.hash, "replaced", undefined, rc.transactionHash);
        setMessage("The original transaction was replaced or cancelled by another confirmed transaction. Open the explorer to review the replacement before taking another action.");
        return;
      }
      let token: string | undefined;
      if (tx.kind === "launch" && rc.status === "success") {
        const logs = rc.logs.filter(l => l.address.toLowerCase() === launchpad(tx.chain).factory?.toLowerCase());
        token = parseEventLogs({ abi: LAUNCH_FACTORY_ABI, eventName: "Launched", logs })[0]?.args.token;
        if (!token) throw new Error("Launch record unavailable");
      }
      settleTransaction(tx.chain, tx.hash, rc.status === "success" ? "confirmed" : "reverted", token, rc.transactionHash !== tx.hash ? rc.transactionHash : undefined);
      if (rc.status === "success") await fetch(`/api/launch/sync?chain=${tx.chain}&tx=${tx.hash}`, { method: "POST", signal: AbortSignal.timeout(10_000) }).catch(() => {});
      setMessage(rc.status === "success" ? "Confirmed on-chain. No new transaction was submitted. Indexed views may take a moment to update." : "This transaction reverted on-chain. Network gas may still have been charged.");
    } catch { setMessage("Confirmation is not available from this RPC yet. Check the original transaction on the explorer before retrying any action."); }
    finally { lock.current = false; setBusy(""); }
  }
  if (!rows.length) return null;
  return <section className="mb-5 rounded-2xl border border-line bg-card p-4 sm:p-5" aria-label="Saved transactions">
    <h2 className="text-sm font-semibold text-ink">{pendingOnly ? "Resume a submitted transaction" : "Your recent transactions"}</h2>
    <p className="mt-1 text-xs leading-relaxed text-muted">Saved in this browser for this wallet. Checking a receipt never submits another transaction.</p>
    <ul className="mt-3 divide-y divide-line">{rows.map(tx => <li key={`${tx.chain}:${tx.hash}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0"><p className="break-words text-sm text-ink">{tx.label}</p><p className="mt-1 text-xs text-muted">{CHAIN_LABELS[tx.chain]} · {tx.state === "pending" ? "Confirmation needed" : tx.state === "confirmed" ? "Confirmed" : tx.state === "replaced" ? "Replaced or cancelled" : "Reverted"}</p><a href={explorerTx(tx.chain, tx.replacementHash ?? tx.hash)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-xs text-brand underline underline-offset-4">{(tx.replacementHash ?? tx.hash).slice(0, 10)}… · Explorer ↗</a></div>
      <div className="flex flex-wrap gap-2">{tx.token && tx.state === "confirmed" ? <Link href={`/t/${tx.chain}/${tx.token}`} className={btn.secondarySm}>Open token</Link> : null}{tx.state === "pending" && <button type="button" disabled={Boolean(busy)} onClick={() => void check(tx)} className={btn.secondarySm}>{busy === tx.hash ? "Checking…" : "Check confirmation"}</button>}</div>
    </li>)}</ul><p role="status" className="text-xs leading-relaxed text-muted">{message}</p>
  </section>;
}
