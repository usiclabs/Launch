"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ago } from "@/lib/launchpad/time";
export default function DataFreshness({ at, failed = false, label = "Snapshot" }: { at: number | null; failed?: boolean; label?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { const update = () => setNow(Date.now()); const initial = setTimeout(update, 0); const timer = setInterval(update, 15_000); return () => { clearTimeout(initial); clearInterval(timer); }; }, []);
  const stale = failed || Boolean(at && now && now - at > 90_000);
  return <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-relaxed ${stale ? "text-warm-ink" : "text-muted"}`}>
    <span>{!at ? `${label}: waiting for data` : `${label} loaded ${now ? `${ago(new Date(at).toISOString(), now)} ago` : "recently"}`}{stale ? " · refresh needed" : ""}</span><Link href="/status" className="inline-flex min-h-8 items-center underline underline-offset-4">Network status</Link>
  </p>;
}
