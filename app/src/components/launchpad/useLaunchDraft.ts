"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { hasDraftContent, LAUNCH_DRAFT_KEY, parseLaunchDraft, type DraftDetails, type LaunchDraft } from "@/lib/launchpad/launch-draft";

type Snapshot = { ready: boolean; pending: LaunchDraft | null; saved: boolean; storageError: boolean };
const INITIAL: Snapshot = { ready: false, pending: null, saved: false, storageError: false };

/** Each form owns its restoration choice; storage remains an external, fallible system. */
function createStore() {
  let snapshot = INITIAL;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<Snapshot>) => {
    const next = { ...snapshot, ...patch };
    if (Object.keys(next).every(key => next[key as keyof Snapshot] === snapshot[key as keyof Snapshot])) return;
    snapshot = next;
    listeners.forEach(listener => listener());
  };
  return {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => snapshot,
    read: () => {
      if (snapshot.ready) return;
      try { update({ ready: true, pending: parseLaunchDraft(window.localStorage.getItem(LAUNCH_DRAFT_KEY)) }); }
      catch { update({ ready: true, storageError: true }); }
    },
    save: (details: DraftDetails) => {
      try {
        const saved = hasDraftContent(details);
        if (saved) window.localStorage.setItem(LAUNCH_DRAFT_KEY, JSON.stringify({ ...details, version: 1, savedAt: Date.now() }));
        else window.localStorage.removeItem(LAUNCH_DRAFT_KEY);
        update({ saved, storageError: false });
      } catch { update({ storageError: true, saved: false }); }
    },
    clear: () => {
      try { window.localStorage.removeItem(LAUNCH_DRAFT_KEY); update({ storageError: false, pending: null, saved: false }); }
      catch { update({ storageError: true, pending: null, saved: false }); }
    },
    restored: () => update({ pending: null }),
  };
}

export function useLaunchDraft(details: DraftDetails, enabled: boolean) {
  const [store] = useState(createStore);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, () => INITIAL);
  useEffect(() => { store.read(); }, [store]);
  useEffect(() => {
    if (snapshot.ready && !snapshot.pending && enabled) store.save(details);
  }, [details, enabled, snapshot.pending, snapshot.ready, store]);
  return { ...snapshot, clear: store.clear, restored: store.restored };
}
