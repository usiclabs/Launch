"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, RefreshCw, TriangleAlert } from "lucide-react";
import { platformStatus, type PlatformStatus, type ServiceState } from "@/lib/platform-status";
import shell from "./sections/SectionShell.module.css";

const LABELS: Record<ServiceState, string> = { available: "Available", delayed: "Delayed", unavailable: "Unavailable" };
const TONES: Record<ServiceState, string> = { available: "text-ink", delayed: "text-warm-ink", unavailable: "text-warm-ink" };

export default function PlatformStatusPanel() {
  const [data, setData] = useState<PlatformStatus | null>(null);
  const [checked, setChecked] = useState<Date | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(true);
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10_000);
    setBusy(true);
    try {
      const response = await fetch("/api/health", { cache: "no-store", signal: controller.signal });
      // A 503 still contains useful service facts. Other response types are not status data.
      if (!response.ok && response.status !== 503) throw new Error("Status unavailable");
      const next = platformStatus(await response.json());
      if (active.current !== controller) return;
      setData(next);
      setChecked(new Date());
      setError(false);
    } catch {
      if (active.current === controller) setError(true);
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => { if (!document.hidden && !active.current) void refresh(); }, 30_000);
    const resume = () => { if (!document.hidden && !active.current) void refresh(); };
    document.addEventListener("visibilitychange", resume);
    return () => { clearTimeout(initial); clearInterval(timer); document.removeEventListener("visibilitychange", resume); const pending = active.current; active.current = null; pending?.abort(); };
  }, [refresh]);
  const title = error ? "Live status unavailable" : !data ? "Checking platform status…" : data.healthy ? "All monitored services available" : "Some services need attention";
  return <div className="space-y-6">
    <section className="rounded-3xl border border-line bg-card p-5 sm:p-7" aria-labelledby="status-heading" aria-busy={busy}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="status" aria-live="polite">
          <h2 id="status-heading" className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{error ? "We could not refresh the service check. Any results below are from the last successful check." : "A live snapshot, refreshed every 30 seconds while this page is visible."}</p>
          {checked && <p className="mt-2 text-xs text-muted">Last checked <time dateTime={checked.toISOString()}>{checked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></p>}
        </div>
        <button type="button" onClick={() => void refresh()} disabled={busy} className={shell.action}><RefreshCw size={15} aria-hidden="true" />{busy ? "Checking…" : "Refresh status"}</button>
      </div>
    </section>
    {data && <ul className="grid gap-3 sm:grid-cols-2" aria-label="Monitored services">{data.items.map(item => {
      const Icon = item.state === "available" ? CheckCircle2 : item.state === "delayed" ? Clock3 : TriangleAlert;
      return <li key={item.name} className="rounded-2xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold text-ink">{item.name}</h3><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${TONES[item.state]}`}><Icon size={14} aria-hidden="true" />{LABELS[item.state]}</span></div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{item.detail}</p>
      </li>;
    })}</ul>}
    <aside className="rounded-2xl border border-line p-5 text-sm leading-relaxed text-muted"><h2 className="font-semibold text-ink">Already submitted a transaction?</h2><p className="mt-2">A delayed page does not mean a transaction failed. Use the explorer link in your wallet or confirmation screen to check the original transaction before submitting another.</p><p className="mt-2">These checks report service configuration and indexer freshness. They do not guarantee a quote, wallet connection, or transaction outcome. Arc is not live yet.</p><Link href="/rules#contracts" className="mt-2 inline-flex min-h-11 items-center gap-1 font-medium text-ink underline underline-offset-4">View network contracts <ArrowUpRight size={14} aria-hidden="true" /></Link></aside>
  </div>;
}
