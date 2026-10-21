"use client";

import { Popover } from "@base-ui/react/popover";
import { CircleHelp, X } from "lucide-react";

/** Click/tap and keyboard help; never requires hover on a phone. */
export default function FieldHelp({ title, children }: { title: string; children: React.ReactNode }) {
  return <Popover.Root>
    <Popover.Trigger type="button" aria-label={`About ${title.toLowerCase()}`} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-ink"><CircleHelp size={15} aria-hidden="true" /></Popover.Trigger>
    <Popover.Portal><Popover.Positioner side="bottom" sideOffset={8} collisionPadding={16} className="z-[120] max-w-[calc(100vw-32px)]">
      <Popover.Popup className="w-72 rounded-2xl border border-line-strong bg-card p-4 text-xs leading-relaxed text-body shadow-xl">
        <div className="flex items-center justify-between gap-2"><Popover.Title className="font-semibold text-ink">{title}</Popover.Title><Popover.Close className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-paper" aria-label="Close explanation"><X size={14} aria-hidden="true" /></Popover.Close></div>
        <Popover.Description>{children}</Popover.Description>
      </Popover.Popup>
    </Popover.Positioner></Popover.Portal>
  </Popover.Root>;
}
