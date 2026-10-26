"use client";
import { useRef, useState } from "react";
const STEPS = [
  ["Choose your pairing", "Your pair token is what buyers use to trade. Choose a network and a pair token you understand."],
  ["Give it an identity", "Add a name, symbol and optional artwork. Review spelling: on-chain names and symbols cannot be edited after launch."],
  ["Set the starting price", "Starting market cap sets the initial pool price. It is not money raised, guaranteed value, or liquidity depth."],
  ["Decide where fees go", "Choose a trading fee and its beneficiaries. These settings are permanent; check every address carefully."],
  ["Review the optional first buy", "A first buy is a separate transaction after launch. You can skip it, and it can fail without undoing the launch."],
  ["Review before you sign", "Check the readiness list and launch summary. LAUNCH simulates the launch and estimates network gas before requesting your signature."],
];
const control = "min-h-11 rounded-xl px-4 text-xs font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";
export default function LaunchGuide() {
  const [step, setStep] = useState<number | null>(null);
  const start = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  function reveal(next: number, focus = false) {
    const section = document.getElementById(`launch-step-${next + 1}`);
    if (focus) section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function go(next: number) {
    setStep(next);
    reveal(next);
    // Keep keyboard navigation inside the guide instead of jumping into the form.
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  function close() {
    setStep(null);
    requestAnimationFrame(() => start.current?.focus({ preventScroll: true }));
  }
  return <>
    <section className="mb-5 rounded-2xl border border-line bg-card p-4 sm:p-5" aria-label="Guided launch">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-ink">Your first launch?</h2><p className="mt-1 text-xs leading-relaxed text-muted">Six short steps, at your pace. You stay in control.</p></div>
        <button ref={start} type="button" aria-expanded={step !== null} aria-controls={step !== null ? "launch-guide" : undefined} onClick={() => go(step ?? 0)} className={`${control} border border-line text-ink hover:bg-raised`}>{step === null ? "Guide me" : "Resume guide"}</button>
      </div>
    </section>
    {step !== null && <section id="launch-guide" aria-label="Launch guide steps" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); close(); } }} className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto max-h-[45dvh] max-w-xl overflow-y-auto overscroll-contain rounded-2xl border border-line-strong bg-raised p-4 shadow-dialog sm:p-5">
      <div className="mb-3 flex gap-1.5" aria-hidden="true">{STEPS.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none ${i <= step ? "bg-brand" : "bg-line"}`} />)}</div>
      <div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-brand">Step {step + 1} of {STEPS.length}</p><button type="button" onClick={close} className={`${control} text-muted hover:bg-card hover:text-ink`}>Close guide</button></div>
      <h2 ref={heading} tabIndex={-1} className="text-base font-semibold tracking-tight text-ink outline-none">{STEPS[step][0]}</h2>
      <p className="mt-2 text-sm leading-relaxed text-body">{STEPS[step][1]}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={step === 0} onClick={() => go(step - 1)} className={`${control} border border-line text-ink hover:bg-card disabled:cursor-not-allowed disabled:opacity-40`}>Back</button>
        <button type="button" onClick={() => step === STEPS.length - 1 ? close() : go(step + 1)} className={`${control} bg-brand text-white hover:brightness-110`}>{step === STEPS.length - 1 ? "Finish guide" : "Next step"}</button>
        <button type="button" onClick={() => reveal(step, true)} className={`${control} text-muted hover:text-ink`}>Go to this section</button>
      </div>
      <p className="mt-3 text-[11px] text-muted">The guide never submits a transaction.</p>
    </section>}
  </>;
}
