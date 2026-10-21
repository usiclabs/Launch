"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const LABELS = ["Pairing", "Token", "Price", "Fees", "First buy", "Review"];

export default function LaunchSectionNav({ complete }: { complete: boolean[] }) {
  const [active, setActive] = useState(1);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(Number(visible[0].target.id.replace("launch-step-", "")));
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    LABELS.forEach((_, index) => {
      const section = document.getElementById(`launch-step-${index + 1}`);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  const count = complete.filter(Boolean).length;
  return (
    <nav
      aria-label="Launch form sections"
      className="sticky top-24 z-30 mb-5 rounded-2xl border border-line bg-raised/95 p-2 shadow-card backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-2 pb-1 pt-1 text-[10px] text-muted">
        <span>Your launch, step by step</span>
        <span>{count} / 6 configured</span>
      </div>
      <ol className="flex gap-1 overflow-x-auto bb-scroll">
        {LABELS.map((label, index) => (
          <li key={label} className="min-w-max flex-1">
            <a
              href={`#launch-step-${index + 1}`}
              aria-current={active === index + 1 ? "step" : undefined}
              onClick={(event) => {
                const section = document.getElementById(`launch-step-${index + 1}`);
                if (!section) return;
                event.preventDefault();
                section.focus({ preventScroll: true });
                section.scrollIntoView({
                  behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
                  block: "start",
                });
                setActive(index + 1);
              }}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] transition-colors motion-reduce:transition-none ${active === index + 1 ? "bg-brand text-white" : "text-muted hover:bg-card hover:text-ink"}`}
            >
              <span className="grid size-4 place-items-center rounded-full border border-current text-[9px]">
                {complete[index] ? <Check size={10} aria-hidden="true" /> : index + 1}
              </span>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
