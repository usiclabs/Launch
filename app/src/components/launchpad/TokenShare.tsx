"use client";

import CreatorKit from "./CreatorKit";
import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Copy, Download, Share2, X } from "lucide-react";
import Image from "next/image";
import { intentUrl } from "@/lib/profiles/xpost";

export default function TokenShare({
  chain,
  token,
  name,
  symbol,
  className,
}: {
  chain: string;
  token: string;
  name: string;
  symbol: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open || !url) return;
    let active = true;
    import("qrcode")
      .then(({ default: code }) =>
        code.toDataURL(url, {
          width: 240,
          margin: 4,
          errorCorrectionLevel: "M",
          color: { dark: "#0F172A", light: "#FFFFFF" },
        }),
      )
      .then((value) => {
        if (active) setQr(value);
      })
      .catch(() => {
        if (active) setMessage("QR code unavailable. You can still copy the link.");
      });
    return () => {
      active = false;
    };
  }, [open, url]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Token link copied.");
    } catch {
      setMessage("Select and copy the link below.");
    }
  }
  async function download() {
    setBusy(true);
    setMessage("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`/t/${chain}/${token}/opengraph-image`, { signal: controller.signal });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("card");
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `launch-${symbol.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "token"}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setMessage("Share card downloaded.");
    } catch {
      setMessage("Share card unavailable. Try downloading again, or copy the link.");
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (value) {
          setUrl(`${window.location.origin}/t/${chain}/${token}`);
          setQr("");
          setMessage("");
        }
        setOpen(value);
      }}
    >
      <Dialog.Trigger className={className} aria-label="Share token">
        <Share2 size={13} aria-hidden="true" />
        <span className="hidden sm:inline">Share</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-scrim/60 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Viewport className="fixed inset-0 z-[91] flex items-end justify-center overflow-y-auto p-3 sm:items-center">
          <Dialog.Popup className="max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border border-line-strong bg-raised p-5 text-ink shadow-dialog transition-[opacity,translate] duration-150 data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Dialog.Title className="break-words text-lg font-semibold">Share {symbol}</Dialog.Title>
                <Dialog.Description className="mt-1 break-words text-xs text-muted">
                  Bring someone to {name} on LAUNCH.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close sharing"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line"
              >
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="mx-auto my-4 grid size-60 max-w-full place-items-center overflow-hidden rounded-2xl bg-white">
              {qr ? (
                <Image
                  unoptimized
                  src={qr}
                  alt={`QR code for ${name} on LAUNCH`}
                  width={240}
                  height={240}
                  className="h-auto max-w-full"
                />
              ) : (
                <span className="p-4 text-center text-xs text-slate-700">{message || "Preparing QR code…"}</span>
              )}
            </div>
            <details className="mb-4 rounded-xl border border-line p-3">
              <summary className="min-h-8 cursor-pointer text-xs font-medium text-ink">Preview your share card</summary>
              {open ? <Image unoptimized src={`/t/${chain}/${token}/opengraph-image`} alt={`${name} branded launch card`} width={1200} height={630} className="mt-3 h-auto w-full rounded-lg border border-line" /> : null}
              <p className="mt-2 text-[11px] leading-relaxed text-muted">Includes the token identity and network. Share the trading link alongside the image so people can open the correct token.</p>
            </details>
            <label className="block text-xs text-muted" htmlFor={`share-${token}`}>
              Token link
            </label>
            <input
              id={`share-${token}`}
              value={url}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-paper px-3 text-xs text-ink"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copy}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
              >
                <Copy size={14} />
                Copy link
              </button>
              <a
                href={intentUrl(`${name} ($${symbol}) on LAUNCH`, { url })}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-center rounded-xl border border-line px-3 text-sm"
              >
                Post on X ↗
              </a>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={download}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-xs disabled:opacity-50"
            >
              <Download size={14} />
              {busy ? "Preparing share card…" : "Download share card"}
            </button>
            {open && url ? <CreatorKit key={`${chain}:${token}`} chain={chain} token={token} name={name} symbol={symbol} url={url} qr={qr} /> : null}
            <p role="status" className="mt-2 min-h-8 text-xs leading-relaxed text-muted">
              {message || "Scan to open this token, or download its image card to share."}
            </p>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
