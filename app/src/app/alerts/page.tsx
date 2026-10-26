import type { Metadata } from "next";
import PriceAlerts from "@/components/launchpad/PriceAlerts";
export const metadata: Metadata = {
  title: "Watchlist alerts",
  alternates: { canonical: "/alerts" },
};
export default function AlertsPage() {
  return (
    <main className="bb-market bb-mid bb-page py-8 sm:py-12">
      <p className="text-xs font-medium uppercase tracking-widest text-brand">
        Personal alerts
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
        Stay close to what matters.
      </h1>
      <div className="mt-6">
        <PriceAlerts />
      </div>
    </main>
  );
}
