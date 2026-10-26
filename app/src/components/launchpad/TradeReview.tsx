"use client";
import { Dialog } from "@base-ui/react/dialog";
import { X, ShieldCheck } from "lucide-react";
import { explorerAddress, type ChainKey, shortAddr } from "@/lib/chainPublic";
export default function TradeReview({
  open,
  onClose,
  onConfirm,
  fields,
  approval,
  chain,
  router,
  wallet,
  impactWarning,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fields: [string, string][];
  approval: boolean;
  chain: ChainKey;
  router: string;
  wallet: string;
  impactWarning: string | null;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-[81] max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-line-strong bg-raised p-5 shadow-dialog sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-brand">
              <ShieldCheck size={16} aria-hidden />
              Your trade, reviewed
            </span>
            <Dialog.Close
              aria-label="Close trade review"
              className="grid size-11 place-items-center rounded-full text-muted hover:bg-card"
            >
              <X size={18} aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Title className="mt-3 text-xl font-semibold tracking-tight text-ink">
            Before your wallet opens.
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-xs leading-relaxed text-muted">
            Check the spend, minimum output and allowances. Your wallet remains
            the final approval step.
          </Dialog.Description>
          <dl className="mt-5 divide-y divide-line">
            {fields.map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 py-3 text-xs"
              >
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className="min-w-0 break-all text-right font-medium text-ink">
                  {value}
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 py-3 text-xs">
              <dt className="text-muted">Signing wallet</dt>
              <dd className="font-mono text-body">{shortAddr(wallet)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3 text-xs">
              <dt className="text-muted">Swap router</dt>
              <dd>
                <a
                  href={explorerAddress(chain, router)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-body underline"
                >
                  {shortAddr(router)} ↗
                </a>
              </dd>
            </div>
          </dl>
          <div className="mt-4 rounded-xl border border-line bg-card p-3 text-xs leading-relaxed text-muted">
            {approval
              ? "If allowances are insufficient, you may be asked to approve unlimited tokens to Permit2 and a router allowance lasting 30 days. Approvals remain until expired or revoked. Each approval is a separate transaction. "
              : "No token approval is required for this native payment. "}
            Network gas is additional; your wallet estimates it. The swap is
            simulated before signing and enforces the minimum output shown.
          </div>
          {impactWarning && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-warm/30 bg-warm-soft p-3 text-xs leading-relaxed text-warm-ink"
            >
              {impactWarning}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Dialog.Close className="min-h-12 rounded-xl border border-line text-sm text-body">
              Cancel
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              className="min-h-12 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
            >
              {impactWarning?.startsWith("Confirm")
                ? "Confirm high impact"
                : "Continue to wallet"}
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted">
            Changing the quote, wallet, amount or slippage closes this review.
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
