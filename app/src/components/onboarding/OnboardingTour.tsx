"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, ArrowRight, Check, ChartNoAxesCombined, CircleHelp, LockKeyhole, MessagesSquare, Rocket, Search, Star, Wallet, X } from "lucide-react";
import Mark from "../launchpad/Mark";
import styles from "./OnboardingTour.module.css";

const STORAGE_KEY = "launch:welcome:v1";
const REPLAY_EVENT = "launch:replay-welcome";
const STEPS = [
  { label: "Welcome", eyebrow: "Your idea starts here", title: "Your idea. Your next move.", description: "A place to discover tokens, follow the market and launch something of your own. Get oriented in five short steps.", href: "/rules#launchpad", link: "See how LAUNCH works" },
  { label: "Discover", eyebrow: "Find your next move", title: "A market with a pulse.", description: "See what’s trending, follow live trades and filter launches by network. Save tokens to a watchlist that stays on this browser.", href: "/#launches", link: "Explore launches", icon: ChartNoAxesCombined },
  { label: "Launch", eyebrow: "From an idea to onchain", title: "Make something yours.", description: "Choose your network and pair, add an identity, then review. One transaction creates your token and pool with liquidity locked forever. Zero platform fees; you pay network gas.", href: "/launch", link: "Open the launch form", icon: Rocket },
  { label: "Your space", eyebrow: "Keep everything in view", title: "One wallet. Your workspace.", description: "Your dashboard brings launches, holdings, trades and claimable fees together. Browse freely first. Connect your wallet when you’re ready to take action.", href: "/me", link: "Visit your dashboard", icon: Wallet },
  { label: "Connect", eyebrow: "More than a launch", title: "Keep the conversation open.", description: "Follow the conversation in Posts, understand the launch mechanics, or build with Agents. Choose where you want to begin.", href: "/feed", link: "Explore community posts", icon: MessagesSquare },
] as const;

/** Replay is available on every page, including when browser storage is unavailable. */
export function TourButton({ className }: { className?: string }) {
  return <button type="button" className={`${styles.replay} ${className ?? ""}`} onClick={() => window.dispatchEvent(new Event(REPLAY_EVENT))}>
    <CircleHelp size={15} aria-hidden="true" /> Take a quick tour
  </button>;
}

export default function OnboardingTour() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dismissed = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const previousPath = useRef(pathname);
  const current = STEPS[step];

  function close() {
    dismissed.current = true;
    try { window.localStorage.setItem(STORAGE_KEY, "seen"); } catch { /* Session dismissal still works without storage. */ }
    setOpen(false);
  }

  function goTo(next: number) {
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
    // Announce the new title and keep keyboard navigation predictable after a step change.
    requestAnimationFrame(() => {
      title.current?.focus({ preventScroll: true });
      panel.current?.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  useEffect(() => {
    const replay = () => { setStep(0); setOpen(true); };
    window.addEventListener(REPLAY_EVENT, replay);
    return () => window.removeEventListener(REPLAY_EVENT, replay);
  }, []);

  useEffect(() => {
    if (pathname !== "/" || dismissed.current) return;
    try { if (window.localStorage.getItem(STORAGE_KEY)) return; } catch { /* Offer the tour for this session. */ }
    // Let the landing page introduce itself first. Never interrupt a wallet or another dialog.
    const timer = window.setTimeout(() => {
      if (dismissed.current || document.visibilityState !== "visible" || document.documentElement.hasAttribute("data-sheet-open") || document.querySelector('[role="dialog"], dialog[open]')) return;
      try { if (window.localStorage.getItem(STORAGE_KEY)) return; } catch { /* Storage is optional. */ }
      setStep(0);
      setOpen(true);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) close(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop className={styles.backdrop} />
      <Dialog.Popup ref={panel} initialFocus={title} className={styles.panel}>
        <header className={styles.header}>
          <span className={styles.wordmark}><Mark size={25} /> LAUNCH <span className={styles.guide}>Your starting point</span></span>
          <Dialog.Close className={styles.close} aria-label="Close introduction"><X size={18} aria-hidden="true" /></Dialog.Close>
        </header>

        <div className={styles.progress} role="progressbar" aria-label="Introduction progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${STEPS.length}: ${current.label}`}><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        <div className={styles.layout}>
          <nav className={styles.steps} aria-label="Introduction steps" onKeyDown={(event) => {
            const next = event.key === "ArrowRight" ? step + 1 : event.key === "ArrowLeft" ? step - 1 : event.key === "Home" ? 0 : event.key === "End" ? STEPS.length - 1 : null;
            if (next !== null) { event.preventDefault(); goTo(next); }
          }}>
            {STEPS.map((item, index) => <button key={item.label} type="button" onClick={() => goTo(index)} className={styles.step} aria-current={index === step ? "step" : undefined} aria-label={`${index + 1}. ${item.label}`}>
              <span className={styles.stepNumber}>{index < step ? <Check size={13} aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span>
              <span className={styles.stepLabel}>{item.label}</span>
            </button>)}
            <p className={styles.sidebarNote}>Your idea.<br />Your launch.</p>
          </nav>

          <div className={styles.content}>
            <div className={styles.scene} key={`scene-${step}`} aria-hidden="true">
              <span className={styles.grid} />
              <span className={styles.sceneGlow} />
              <span className={styles.sceneSweep} />
              <span className={styles.sceneCaption}>LAUNCH / {current.label.toUpperCase()}</span>
              <span className={styles.sceneIndex}>{String(step + 1).padStart(2, "0")} / 05</span>
              <Scene step={step} />
              <span className={styles.sceneFootnote}>{step === 1 ? "Explore · Follow · Discover" : step === 2 ? "Token → Pool → Locked liquidity" : step === 3 ? "Your launches · Your activity" : step === 4 ? "Build · Share · Connect" : "An open space for your next idea"}</span>
            </div>

            <div className={styles.copy} key={`copy-${step}`}>
              <p className={styles.eyebrow}>{current.eyebrow}</p>
              <Dialog.Title ref={title} tabIndex={-1} className={styles.title}>{current.title}</Dialog.Title>
              <Dialog.Description className={styles.description}>{current.description}</Dialog.Description>
              <div className={styles.highlights} aria-label="At a glance">{[ ["Explore first", "No wallet needed"], ["Live activity", "Personal watchlist"], ["One transaction", "Zero platform fees"], ["Your wallet", "Your activity"], ["Community", "Developer tools"] ][step].map(label => <span key={label}><Check size={11} aria-hidden="true" />{label}</span>)}</div>
              <Link href={current.href} onClick={close} className={styles.sectionLink}>{current.link}<ArrowRight size={14} aria-hidden="true" /></Link>
            </div>

            <div className={styles.controls}>
              <div className={styles.secondaryControls}>
                {step === 0 ? <button type="button" onClick={close} className={styles.quiet}>Skip tour</button> : <button type="button" onClick={() => goTo(step - 1)} className={styles.quiet}><ArrowLeft size={15} aria-hidden="true" /> Back</button>}
                <span className={styles.count} aria-label={`Step ${step + 1} of ${STEPS.length}`}>{String(step + 1).padStart(2, "0")}<span> / {String(STEPS.length).padStart(2, "0")}</span></span>
              </div>
              {step === STEPS.length - 1 ? <Link href="/launch" onClick={close} className={styles.primary}>Launch a token <ArrowRight size={16} aria-hidden="true" /></Link> : <button type="button" onClick={() => goTo(step + 1)} className={styles.primary}>{step === 0 ? "Show me around" : `Next: ${STEPS[step + 1].label}`}<ArrowRight size={16} aria-hidden="true" /></button>}
            </div>
            {step === STEPS.length - 1 ? <button type="button" onClick={close} className={styles.finish}>Explore the market instead</button> : <p className={styles.reassurance}>No rush. You can replay this tour anytime.</p>}
          </div>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

function Scene({ step }: { step: number }) {
  if (step === 0) return <div className={styles.orbit}>
    <span className={styles.orbitRing} /><span className={styles.orbitRingInner} />
    <span className={styles.orbitDot} /><span className={styles.orbitDotSecond} /><div className={styles.coin}><Mark size={70} /></div>
    <span className={styles.floatingLabel}><Rocket size={13} /> Your next idea</span>
  </div>;
  if (step === 1) return <div className={styles.marketPreview}>
    <div className={styles.previewSearch}><Search size={13} /><span>Discover your next token</span><Star size={13} /></div>
    {["Trending", "New launches", "Your watchlist"].map((label, index) => <div key={label} className={styles.marketRow}>
      <span className={styles.tokenTile}>{index === 2 ? <Star size={17} /> : <Mark size={25} />}</span><span>{label}</span>
      <svg viewBox="0 0 90 28" fill="none" className={styles.sparkline}><path d={index === 1 ? "M2 19L15 13L28 19L42 10L55 14L68 7L88 10" : "M2 24L15 22L28 13L42 17L55 9L68 13L88 3"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>)}
  </div>;
  if (step === 2) return <div className={styles.mechanism}>
    <div className={styles.mechanismNode}><div className={styles.nodeIcon}><Mark size={34} /></div><span>Your token</span></div>
    <span className={styles.connector}><ArrowRight size={16} /></span>
    <div className={styles.mechanismNode}><div className={styles.nodeIcon}><ChartNoAxesCombined size={26} /></div><span>Pool</span></div>
    <span className={styles.connector}><ArrowRight size={16} /></span>
    <div className={styles.mechanismNode}><div className={styles.nodeIcon}><LockKeyhole size={25} /></div><span>Locked</span></div>
  </div>;
  if (step === 3) return <div className={styles.workspace}>
    <div className={styles.workspaceTop}><span className={styles.walletIcon}><Wallet size={22} /></span><div><strong>Your workspace</strong><span>Connected to your next move</span></div></div>
    {["Your launches", "Claimable trading fees", "Holdings & trades"].map((label) => <div key={label} className={styles.workspaceRow}><span>{label}</span><ArrowRight size={13} /></div>)}
  </div>;
  return <div className={styles.community}>
    {[{ icon: MessagesSquare, title: "Posts", subtitle: "Join the conversation" }, { icon: CircleHelp, title: "How it works", subtitle: "Understand the mechanics" }, { icon: Rocket, title: "Agents", subtitle: "Build on LAUNCH" }].map(({ icon: Icon, title, subtitle }) => <div key={title} className={styles.communityCard}><span><Icon size={21} /></span><strong>{title}</strong><small>{subtitle}</small></div>)}
  </div>;
}
