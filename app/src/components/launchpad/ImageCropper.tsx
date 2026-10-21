"use client";

import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, Move, RotateCcw, X } from "lucide-react";
import { cropRect } from "@/lib/launchpad/image-crop";
import { BANNER_HEIGHT, BANNER_WIDTH, IMAGE_SIZE, type ImageRole } from "@/lib/launchpad/images";
import { btn } from "@/components/ui";
import { Spinner } from "@/components/Skeleton";

export default function ImageCropper({ source, kind, onClose, onSave }: { source: string; kind: ImageRole; onClose: () => void; onSave: (file: File) => Promise<void> }) {
  const [size, setSize] = useState<{width:number;height:number}|null>(null);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const image = useRef<HTMLImageElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const drag = useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const banner = kind === "banner";
  const rect = size ? cropRect(size.width,size.height,banner?3:1,zoom,x,y) : null;

  async function save() {
    if (!image.current || !rect || busy) return;
    setBusy(true); setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = banner ? BANNER_WIDTH : IMAGE_SIZE;
      canvas.height = banner ? BANNER_HEIGHT : IMAGE_SIZE;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image editing is unavailable in this browser. Try another browser or paste an image URL.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image.current, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Could not prepare this image. Try another file.")),"image/webp",.9));
      await onSave(new File([blob], `${kind}.webp`, {type:blob.type}));
      onClose();
    } catch (e) { setError(e instanceof Error?e.message:"Could not prepare this image. Try again."); }
    finally {setBusy(false);}
  }

  return <Dialog.Root open onOpenChange={value=>{if(!value&&!busy) onClose();}}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-[115] bg-scrim/50 backdrop-blur-sm" />
      <Dialog.Popup initialFocus={title} className="fixed bottom-0 left-0 z-[116] max-h-[94dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-line-strong bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between gap-3"><Dialog.Title ref={title} tabIndex={-1} className="text-xl font-semibold tracking-tight text-ink">Frame your {banner?"banner":"token image"}.</Dialog.Title><Dialog.Close disabled={busy} aria-label="Cancel image crop" className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-paper disabled:opacity-50"><X size={18} aria-hidden="true" /></Dialog.Close></div>
        <Dialog.Description className="mb-4 text-xs leading-relaxed text-muted">Drag to position, or use the sliders. The preview is exactly what gets uploaded.</Dialog.Description>
        <div className={`relative mx-auto w-full touch-none select-none overflow-hidden border border-line bg-paper ${banner?"aspect-[3/1] rounded-xl":"aspect-square max-h-[38dvh] max-w-[min(100%,38dvh)] rounded-3xl"}`} aria-label="Image crop preview"
          onPointerDown={event=>{if(!rect||busy) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,left:x,top:y};}}
          onPointerMove={event=>{if(!drag.current||!size||!rect||busy) return;const bounds=event.currentTarget.getBoundingClientRect();const overflowX=bounds.width*(size.width/rect.width-1);const overflowY=bounds.height*(size.height/rect.height-1); if(overflowX>0) setX(Math.max(0,Math.min(100,drag.current.left-(event.clientX-drag.current.x)*100/overflowX)));if(overflowY>0) setY(Math.max(0,Math.min(100,drag.current.top-(event.clientY-drag.current.y)*100/overflowY)));}}
          onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={image} src={source} alt="Your selected artwork" draggable={false} onLoad={event=>setSize({width:event.currentTarget.naturalWidth,height:event.currentTarget.naturalHeight})} onError={()=>setError("This image could not be opened. Try a PNG, JPEG or WebP.")} style={rect&&size?{position:"absolute",maxWidth:"none",width:`${size.width/rect.width*100}%`,height:`${size.height/rect.height*100}%`,left:`${-rect.x/rect.width*100}%`,top:`${-rect.y/rect.height*100}%`}:{visibility:"hidden"}} />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">{Array.from({length:9},(_,i)=><span key={i} className="border border-white/15" />)}</span>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted"><Move size={12} aria-hidden="true" />{banner?"1500 × 500 · 3:1 banner":"512 × 512 · square token image"}</p>
        {source.startsWith("data:image/gif") ? <p className="mt-1 text-center text-[11px] text-muted">GIF artwork is saved as a still image.</p> : null}
        <fieldset disabled={busy||!size} className="mt-4 grid gap-3">
          {[{label:"Zoom",value:zoom,set:setZoom,min:1,max:3,step:.01},{label:"Horizontal position",value:x,set:setX,min:0,max:100,step:1},{label:"Vertical position",value:y,set:setY,min:0,max:100,step:1}].map(control=><label key={control.label} className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-3 text-xs text-body"><span>{control.label}</span><input type="range" aria-label={control.label} min={control.min} max={control.max} step={control.step} value={control.value} onChange={event=>control.set(Number(event.target.value))} className="h-9 w-full accent-brand" /></label>)}
        </fieldset>
        {error?<p role="alert" className="mt-3 text-xs text-down-ink">{error}</p>:null}
        <div className="mt-5 flex items-center justify-between gap-3"><button type="button" disabled={busy} onClick={()=>{setZoom(1);setX(50);setY(50);}} className={btn.secondarySm}><RotateCcw size={13} aria-hidden="true" />Reset crop</button><button type="button" disabled={busy||!size} onClick={()=>void save()} className={btn.primary}>{busy?<><Spinner size={14} />Uploading…</>:<><Check size={15} aria-hidden="true" />Use this {banner?"banner":"image"}</>}</button></div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
