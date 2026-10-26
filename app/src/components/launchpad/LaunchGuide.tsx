"use client";
import { useState } from "react";
const STEPS = [
  ["Choose your pairing", "Your pair token is what buyers use to trade. Choose a network and a pair token you understand."],
  ["Give it an identity", "Add a name, symbol and optional artwork. Review spelling: on-chain names and symbols cannot be edited after launch."],
  ["Set the starting price", "Starting market cap sets the initial pool price. It is not money raised, guaranteed value, or liquidity depth."],
  ["Decide where fees go", "Choose a trading fee and its beneficiaries. These settings are permanent; check every address carefully."],
  ["Review the optional first buy", "A first buy is a separate transaction after launch. You can skip it, and it can fail without undoing the launch."],
  ["Review before you sign", "Check the readiness list and launch summary. LAUNCH simulates the launch and estimates network gas before requesting your signature."],
];
export default function LaunchGuide() {
  const [step, setStep] = useState<number | null>(null);
  function go(next: number) {
    setStep(next);
    const section = document.getElementById(`launch-step-${next + 1}`);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return <section className={step === null ? "mb-5 rounded-2xl border border-line bg-card p-4 sm:p-5" : "fixed inset-x-3 bottom-4 z-50 mx-auto max-h-[45dvh] max-w-xl overflow-y-auto rounded-2xl border border-line-strong bg-raised p-4 shadow-dialog sm:p-5"} aria-label="Guided launch">
    {step === null ? <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-ink">Your first launch?</h2><p className="mt-1 text-xs text-muted">Six short explanations, at your pace. No transactions are submitted by the guide.</p></div><button type="button" onClick={() => go(0)} className="min-h-11 rounded-xl border border-line px-4 text-xs font-semibold text-ink">Guide me</button></div> : <div>
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-brand">Step {step + 1} of 6</p><button type="button" onClick={() => setStep(null)} className="min-h-11 px-2 text-xs text-muted">Close guide</button></div>
      <h2 className="text-sm font-semibold text-ink">{STEPS[step][0]}</h2><p className="mt-2 text-sm leading-relaxed text-body">{STEPS[step][1]}</p>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={step === 0} onClick={() => go(Math.max(0, step - 1))} className="min-h-11 rounded-xl border border-line px-4 text-xs text-ink disabled:opacity-40">Back</button><button type="button" onClick={() => step === 5 ? setStep(null) : go(step + 1)} className="min-h-11 rounded-xl bg-brand px-4 text-xs font-semibold text-white">{step === 5 ? "Finish guide" : "Next step"}</button><button type="button" onClick={() => go(step)} className="min-h-11 px-3 text-xs text-muted">Go to this section</button></div>
    </div>}
  </section>;
}
