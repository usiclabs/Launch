"use client";
import { useEffect, useState } from "react";
import { JOURNAL_KEY, readTransactions, type SavedTransaction } from "@/lib/launchpad/transaction-journal";
export function useTransactionJournal(wallet?: string) {
  const [snapshot, setSnapshot] = useState<{ ready: boolean; rows: SavedTransaction[] }>({ ready: false, rows: [] });
  useEffect(() => {
    const update = () => setSnapshot({ ready: true, rows: readTransactions() });
    const timer = setTimeout(update, 0);
    window.addEventListener(JOURNAL_KEY, update);
    window.addEventListener("storage", update);
    return () => { clearTimeout(timer); window.removeEventListener(JOURNAL_KEY, update); window.removeEventListener("storage", update); };
  }, []);
  return { ready: snapshot.ready, rows: snapshot.rows.filter(r => wallet && r.wallet.toLowerCase() === wallet.toLowerCase()) };
}
