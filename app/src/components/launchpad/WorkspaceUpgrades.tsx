"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  backup,
  restore,
  validate,
  KEYS,
  type Backup,
} from "@/lib/launchpad/workspace-backup";
import {
  parseTemplate,
  type LaunchTemplate,
} from "@/lib/launchpad/workspace-tools";
import styles from "./WorkspacePolish.module.css";
const button =
  "min-h-11 rounded-xl border border-line px-4 text-xs font-medium text-ink hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40";
export function WorkspaceBackup() {
  const file = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Backup | null>(null);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <section
      id="workspace-backup"
      className={`${styles.surface} mt-6 rounded-3xl border border-line p-5 sm:p-8`}
    >
      <p className="text-xs uppercase tracking-widest text-muted">
        Yours to keep
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-ink">
        Your workspace, wherever you go.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-body">
        Export watchlists, templates, named draft projects, alerts, saved views
        and display preferences in one file. Wallet credentials, transaction
        history and the automatic recovery draft are excluded. Artwork remains
        links, not image files.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          disabled={busy || done}
          className={button}
          onClick={() => {
            try {
              const b = backup(localStorage);
              const u = URL.createObjectURL(
                new Blob([JSON.stringify(b, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = u;
              a.download = "launch-workspace.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(u), 1000);
              setNote(
                "Backup exported. Keep it private: it includes saved tokens and beneficiary addresses.",
              );
            } catch (e) {
              setNote(String(e));
            }
          }}
        >
          Export workspace
        </button>
        <button
          disabled={busy || done}
          className={button}
          onClick={() => file.current?.click()}
        >
          Choose backup file
        </button>
      </div>
      <input
        ref={file}
        className="sr-only"
        type="file"
        accept=".json,application/json"
        aria-label="Import workspace backup"
        disabled={busy || done}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setPreview(null);
          setConsent(false);
          setBusy(true);
          try {
            if (f.size > 400000) throw Error("Maximum file size is 400 KB.");
            setPreview(validate(await f.text()));
            setNote("File validated. Nothing has changed yet.");
          } catch (e) {
            setNote(String(e));
          } finally {
            setBusy(false);
          }
        }}
      />
      {preview && (
        <div className="mt-5 rounded-2xl border border-line-strong p-5">
          <h3 className="font-semibold text-ink">Review your backup</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(preview.data).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs capitalize text-muted">{k}</dt>
                <dd className="text-sm text-ink">
                  {Array.isArray(v) ? v.length : v ? "Included" : "Defaults"}
                </dd>
              </div>
            ))}
          </dl>
          <label className="my-4 flex gap-3 text-xs leading-relaxed text-body">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Replace these categories, including empty ones. I have backed up
            anything I want to keep and closed other LAUNCH tabs. Active alerts
            may resume after restoration.
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={!consent}
              className={button}
              onClick={() => {
                try {
                  restore(localStorage, preview);
                  const p = preview.data.preferences as {
                    chain: string;
                  } | null;
                  document.cookie = p
                    ? `launch_preferred_chain=${p.chain}; path=/; max-age=31536000; samesite=lax`
                    : "launch_preferred_chain=; path=/; max-age=0; samesite=lax";
                  setDone(true);
                  setPreview(null);
                  setNote("Workspace restored. Reload to refresh every view.");
                } catch (e) {
                  setNote(String(e));
                }
              }}
            >
              Replace workspace data
            </button>
            <button
              className={button}
              onClick={() => {
                setPreview(null);
                setNote("Cancelled. Nothing was changed.");
              }}
            >
              Cancel restore
            </button>
          </div>
        </div>
      )}
      {done && (
        <button className={`${button} mt-4`} onClick={() => location.reload()}>
          Reload LAUNCH
        </button>
      )}
      <p role="status" className="mt-3 min-h-5 text-xs text-muted">
        {busy ? "Reading backup…" : note}
      </p>
    </section>
  );
}
export function DraftProjects({
  current,
  onApply,
  disabled,
}: {
  current: LaunchTemplate;
  onApply: (t: LaunchTemplate) => void;
  disabled: boolean;
}) {
  const [rows, setRows] = useState<LaunchTemplate[]>([]);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<LaunchTemplate | null>(null);
  const [removed, setRemoved] = useState<LaunchTemplate | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const data = backup(localStorage);
        setRows(data.data.projects as LaunchTemplate[]);
        setReady(true);
      } catch {
        setNote("Saved workspace could not be read. No data has been changed.");
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  function persist(next: LaunchTemplate[]) {
    try {
      const latest = JSON.parse(localStorage.getItem(KEYS.projects) ?? "[]");
      if (JSON.stringify(latest) !== JSON.stringify(rows)) {
        setRows(
          latest
            .map((x: unknown) => parseTemplate(JSON.stringify(x)))
            .filter((x: LaunchTemplate | null): x is LaunchTemplate => x !== null),
        );
        setNote("Projects changed in another tab. Review and retry.");
        return false;
      }
      localStorage.setItem(KEYS.projects, JSON.stringify(next));
      setRows(next);
      return true;
    } catch {
      setNote("Storage is unavailable. Projects were not changed.");
      return false;
    }
  }
  function save() {
    const t = parseTemplate(
      JSON.stringify({
        ...current,
        label: label.trim() || current.details.name || "Untitled project",
      }),
    );
    if (!t) {
      setNote("Check field lengths and numeric settings before saving.");
      return false;
    }
    const next = [t, ...rows.filter((r) => r.label !== t.label)];
    if (next.length > 10) {
      setNote("Maximum 10 projects. Update or remove a project first.");
      return false;
    }
    if (!persist(next)) return false;
    setLabel(t.label);
    setNote("Project saved. Use the same name to update it.");
    return true;
  }
  return (
    <details
      className={`${styles.disclosure} mb-5 border border-line p-4 sm:p-5`}
    >
      <summary className="min-h-11 cursor-pointer text-sm font-semibold text-ink">
        Draft projects
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Keep up to 10 unfinished launches. Named projects save when you choose
        Save project; the automatic recovery draft remains separate. First-buy
        amounts are cleared and custom pairs need reselecting.
      </p>
      <fieldset
        disabled={disabled || !ready}
        className="mt-4 space-y-3 disabled:opacity-50"
      >
        <label className="block text-xs text-muted">
          Project name
          <input
            maxLength={60}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My next idea"
            className="mt-2 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink"
          />
        </label>
        <button type="button" className={button} onClick={save}>
          Save project
        </button>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <span className="break-all text-sm text-ink">
                {r.label}
                <small className="ml-2 text-muted">{r.details.chain}</small>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={button}
                  onClick={() => setPending(r)}
                >
                  Open project
                </button>
                <button
                  type="button"
                  className={button}
                  aria-label={`Remove project ${r.label}`}
                  onClick={() => {
                    if (persist(rows.filter((x) => x.label !== r.label))) {
                      setRemoved(r);
                      setNote("Project removed.");
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        {!rows.length && (
          <p className="text-xs text-muted">
            No named projects yet. Incomplete token details can be saved.
          </p>
        )}
        {pending && (
          <div className="rounded-xl border border-line-strong p-4">
            <p className="text-sm text-ink">Open {pending.label}?</p>
            <p className="my-3 text-xs text-muted">
              This replaces the current form and automatic recovery draft. Save
              your current work under another project name first if you want to
              keep it.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={button}
                onClick={() => {
                  onApply(pending);
                  setLabel(pending.label);
                  setPending(null);
                  setNote("Project opened. Review settings before launching.");
                }}
              >
                Replace form and open
              </button>
              <button
                type="button"
                className={button}
                onClick={() => setPending(null)}
              >
                Cancel switch
              </button>
            </div>
          </div>
        )}
        {removed && (
          <button
            type="button"
            disabled={rows.length >= 10}
            className={button}
            onClick={() => {
              if (
                persist([
                  removed,
                  ...rows.filter((x) => x.label !== removed.label),
                ])
              ) {
                setRemoved(null);
                setNote("Project restored.");
              }
            }}
          >
            Undo removal
          </button>
        )}
      </fieldset>
      <p role="status" className="mt-3 text-xs text-muted">
        {note}
      </p>
      <Link
        href="/preferences#workspace-backup"
        className="mt-2 inline-flex min-h-11 items-center text-xs text-body underline"
      >
        Back up your projects
      </Link>
    </details>
  );
}
export function ReleaseHighlights() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const key = "launch:release-seen:v1";
  const release = "experience-2026-10-27";
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setVisible(localStorage.getItem(key) !== release);
      } catch {
        setVisible(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(key, release);
    } catch {}
  }
  if (!visible || pathname !== "/") return null;
  return (
    <aside aria-label="What’s new on LAUNCH" className="bb-market bb-mid bb-page pt-3 sm:pt-4">
      <div className={`${styles.surface} flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-card/70 px-3 py-2.5 sm:px-4`}>
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand shadow-[0_0_12px_var(--color-glow)]" />
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-body">
          <span className="mr-2 font-semibold text-ink">A clearer way to LAUNCH.</span>
          Refined onboarding and Robinhood Chain discovery are live.
        </p>
        <Link href="/changelog" onClick={dismiss} className="inline-flex min-h-11 items-center text-xs font-semibold text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">
          View changelog <span aria-hidden="true" className="ml-1">↗</span>
        </Link>
        <button type="button" aria-label="Dismiss release highlights" onClick={dismiss} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-lg leading-none text-muted transition-colors hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-brand">
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  );
}
