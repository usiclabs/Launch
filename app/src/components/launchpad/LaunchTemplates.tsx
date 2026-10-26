"use client";
import { useEffect, useRef, useState } from "react";
import {
  parseTemplate,
  type LaunchTemplate,
} from "@/lib/launchpad/workspace-tools";
const KEY = "launch:templates:v1";
const button =
  "min-h-11 rounded-xl border border-line px-3 text-xs text-ink transition-colors hover:bg-raised disabled:opacity-40";
export default function LaunchTemplates({
  current,
  onApply,
  disabled,
}: {
  current: LaunchTemplate;
  onApply: (t: LaunchTemplate) => void;
  disabled: boolean;
}) {
  const [templates, setTemplates] = useState<LaunchTemplate[]>([]);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
        if (Array.isArray(v))
          setTemplates(
            v
              .slice(0, 10)
              .map((x) => parseTemplate(JSON.stringify(x)))
              .filter((x): x is LaunchTemplate => !!x),
          );
      } catch {
        setNote(
          "Saved templates could not be read. Export a copy before leaving this page.",
        );
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function persist(next: LaunchTemplate[]) {
    setTemplates(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setNote("Templates saved in this browser.");
    } catch {
      setNote(
        "Browser storage is unavailable. Export your template to keep a copy.",
      );
    }
  }
  function save() {
    const t = parseTemplate(
      JSON.stringify({
        ...current,
        label: label.trim() || current.details.name || "Untitled launch",
      }),
    );
    if (!t) {
      setNote("Add token details and valid launch settings before saving.");
      return;
    }
    persist([t, ...templates.filter((x) => x.label !== t.label)].slice(0, 10));
  }
  function download() {
    const t = parseTemplate(
      JSON.stringify({
        ...current,
        label: label.trim() || current.details.name || "Launch template",
      }),
    );
    if (!t) {
      setNote("Add token details and valid settings before exporting.");
      return;
    }
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(t, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "launch-template.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    setNote(
      "Template exported. It contains artwork URLs and beneficiary addresses; review before sharing.",
    );
  }
  return (
    <details className="mb-5 rounded-2xl border border-line bg-card p-4 sm:p-5">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold text-ink">
        Launch templates{" "}
        <span className="ml-2 text-xs font-normal text-muted">
          Save a setup. Make it yours.
        </span>
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Up to 10 named templates, saved on this device. Applying one replaces
        the current form. First buys are always reset; custom pair tokens must
        be selected again. Nothing is submitted.
      </p>
      <fieldset
        disabled={disabled || !ready}
        className="mt-4 space-y-3 disabled:opacity-50"
      >
        <label className="block text-xs text-muted">
          Template name
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink"
            placeholder="My next launch"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={save} className={button}>
            Save template
          </button>
          <button type="button" onClick={download} className={button}>
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => file.current?.click()}
            className={button}
          >
            Import JSON
          </button>
        </div>
        <input
          ref={file}
          aria-label="Import launch template"
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (f.size > 20000) {
              setNote("Template must be smaller than 20 KB.");
              return;
            }
            try {
              const t = parseTemplate(await f.text());
              if (!t) {
                setNote("This is not a valid LAUNCH template.");
                return;
              }
              persist(
                [t, ...templates.filter((x) => x.label !== t.label)].slice(
                  0,
                  10,
                ),
              );
              setNote("Imported. Review the template, then choose Apply.");
            } catch {
              setNote("The file could not be read.");
            }
          }}
        />
        <ul className="divide-y divide-line">
          {templates.map((t, i) => (
            <li
              key={t.label}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <span className="min-w-0 break-words text-sm text-body">
                {t.label}
                <span className="ml-2 text-xs text-muted">
                  {t.details.symbol} · {t.details.chain}
                </span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApply(t);
                    setNote(
                      "Template applied. Review pairing, market cap and every beneficiary before launching. First buy cleared.",
                    );
                  }}
                  className={button}
                >
                  Apply
                </button>
                <button
                  type="button"
                  aria-label={`Delete template ${t.label}`}
                  onClick={() => persist(templates.filter((_, n) => n !== i))}
                  className={button}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {!templates.length && (
          <p className="text-xs text-muted">No saved templates yet.</p>
        )}
      </fieldset>
      <p role="status" className="mt-2 text-xs leading-relaxed text-muted">
        {note}
      </p>
    </details>
  );
}
