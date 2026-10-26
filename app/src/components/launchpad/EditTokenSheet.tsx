"use client";

import Image from "next/image";
import { useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import Sheet from "@/components/Sheet";
import { btn, helper, input, label } from "@/components/ui";
import ImageUpload from "./ImageUpload";
import { buildEditMessage, validateEdit, type EditFields } from "@/lib/launchpad/editAuth";
import { CHAINS, type ChainKey } from "@/lib/chainPublic";
import { friendlyError } from "@/lib/errors";

/**
 * Creator-only edit of off-chain details. Flow: nonce → sign (personal_sign, no gas) → POST.
 * The message the wallet shows names the chain, token, nonce, expiry and every change.
 */
export default function EditTokenSheet({ chain, token, symbol, initial, onClose, onSaved }: { chain: ChainKey; token: string; symbol: string; initial: EditFields; onClose: () => void; onSaved: (f: EditFields) => void }) {
  const config = useConfig();
  const { address } = useAccount();
  const [f, setF] = useState<EditFields>({ description: initial.description ?? "", image_url: initial.image_url ?? "", banner_url: initial.banner_url ?? "", website: initial.website ?? "", x_handle: initial.x_handle ?? "" });
  const [phase, setPhase] = useState<"idle" | "nonce" | "sign" | "save" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  const v = validateEdit(f);

  async function save() {
    if (!address || !v.ok) return;
    setErr(null);
    try {
      setPhase("nonce");
      const nr = await fetch("/api/launch/edit/nonce", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chain, token, wallet: address }) });
      const n = (await nr.json()) as { nonce?: string; expiresAt?: number; error?: string };
      if (!nr.ok || !n.nonce || !n.expiresAt) throw new Error(n.error ?? "could not start edit");
      setPhase("sign");
      const wallet = await getWalletClient(config, { chainId: CHAINS[chain].id });
      const message = buildEditMessage({ chain, token, wallet: address, nonce: n.nonce, expiresAt: n.expiresAt, fields: v.value });
      const signature = await wallet.signMessage({ message });
      setPhase("save");
      const er = await fetch("/api/launch/edit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chain, token, wallet: address, nonce: n.nonce, expiresAt: n.expiresAt, signature, fields: v.value }) });
      const e = (await er.json()) as { ok?: boolean; error?: string };
      if (!er.ok || !e.ok) throw new Error(e.error ?? "edit rejected");
      setPhase("done");
      onSaved(v.value);
      setTimeout(onClose, 600);
    } catch (e) {
      setPhase("idle");
      setErr(friendlyError(e));
    }
  }

  const busy = phase !== "idle" && phase !== "done";
  return (
    <Sheet title={`Edit ${symbol}`} onClose={onClose}>
      <fieldset disabled={busy} className="min-w-0 space-y-4 disabled:opacity-70">
        <p className="text-xs text-muted">Only off-chain details. Name, symbol, fee and beneficiaries live on-chain and cannot change. Saving asks your wallet for a free signature, no transaction.</p>
        <div>
          <label className={label} htmlFor="e-desc">Description</label>
          <textarea id="e-desc" className={`${input} h-auto py-3 min-h-20`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value.slice(0, 280) })} />
          <p className={helper}>{280 - (f.description?.length ?? 0)} left</p>
        </div>
        <div>
          <p className={label}>Image</p>
          <ImageUpload compact value={f.image_url ?? ""} onChange={(url) => setF({ ...f, image_url: url })} wallet={address} />
        </div>
        <div>
          <p className={label}>Banner</p>
          <ImageUpload kind="banner" value={f.banner_url ?? ""} onChange={(url) => setF({ ...f, banner_url: url })} wallet={address} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="e-web">Website</label>
            <input id="e-web" className={input} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="https://" />
          </div>
          <div>
            <label className={label} htmlFor="e-x">X</label>
            <input id="e-x" className={input} value={f.x_handle} onChange={(e) => setF({ ...f, x_handle: e.target.value })} onBlur={() => { if (v.ok && v.value.x_handle) setF((p) => ({ ...p, x_handle: `@${v.value.x_handle}` })); }} placeholder="@handle or x.com link" autoCapitalize="none" spellCheck={false} />
          </div>
        </div>
        <details className="rounded-2xl border border-line bg-card p-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold text-ink">Preview your metadata changes</summary><p className="mt-2 text-xs text-muted">Preview only. Changes publish after your signature is verified and the save succeeds.</p>{v.ok ? <div className="mt-4 overflow-hidden rounded-xl border border-line">{v.value.banner_url&&<Image unoptimized src={v.value.banner_url} alt="Proposed banner" width={600} height={200} className="aspect-[3/1] w-full object-cover"/>}<div className="space-y-3 p-4">{v.value.image_url&&<Image unoptimized src={v.value.image_url} alt="Proposed token logo" width={64} height={64} className="size-16 rounded-xl object-cover"/>}<p className="break-words text-lg font-semibold text-ink">{symbol}</p><p className="whitespace-pre-wrap break-words text-sm text-body">{v.value.description || "No description"}</p><p className="break-all text-xs text-muted">Website: {v.value.website || "None"}</p><p className="break-all text-xs text-muted">X: {v.value.x_handle ? `@${v.value.x_handle}` : "None"}</p></div></div>:<p className="mt-3 text-xs text-warm-ink">Resolve the validation message below to preview valid metadata.</p>}</details>
        {!v.ok ? <p className="text-xs text-warm-ink">{v.error}</p> : null}
        {err ? <p className="rounded-xl bg-down-soft border border-down/20 text-down-ink text-sm px-3 py-2">{err}</p> : null}
        <button type="button" onClick={() => void save()} disabled={busy || !v.ok || !address} className={`${btn.primary} w-full`}>
          {phase === "nonce" ? "Preparing…" : phase === "sign" ? "Sign in your wallet…" : phase === "save" ? "Saving…" : phase === "done" ? "Saved" : "Sign & save"}
        </button>
      </fieldset>
    </Sheet>
  );
}
