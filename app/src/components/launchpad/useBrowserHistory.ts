"use client";

import { useSyncExternalStore } from "react";
import {
  createHistoryStore,
  parseRecentSearches,
  parseRecentTokens,
  RECENT_SEARCHES_KEY,
  RECENT_TOKENS_KEY,
  type RecentToken,
} from "@/lib/launchpad/browser-history";

const tokens = createHistoryStore({
  read: () => localStorage.getItem(RECENT_TOKENS_KEY),
  write: (raw) => localStorage.setItem(RECENT_TOKENS_KEY, raw),
  parse: parseRecentTokens,
});
const searches = createHistoryStore({
  read: () => localStorage.getItem(RECENT_SEARCHES_KEY),
  write: (raw) => localStorage.setItem(RECENT_SEARCHES_KEY, raw),
  parse: parseRecentSearches,
});

function subscribe<T>(store: ReturnType<typeof createHistoryStore<T>>, key: string, listener: () => void) {
  const off = store.subscribe(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === key || event.key === null) store.refresh();
  };
  window.addEventListener("storage", sync);
  if (!store.getSnapshot().ready) store.refresh();
  return () => {
    off();
    window.removeEventListener("storage", sync);
  };
}
const subscribeTokens = (fn: () => void) => subscribe(tokens, RECENT_TOKENS_KEY, fn);
const subscribeSearches = (fn: () => void) => subscribe(searches, RECENT_SEARCHES_KEY, fn);
export const useRecentTokens = () =>
  useSyncExternalStore(subscribeTokens, tokens.getSnapshot, tokens.getServerSnapshot);
export const useRecentSearches = () =>
  useSyncExternalStore(subscribeSearches, searches.getSnapshot, searches.getServerSnapshot);
export function rememberToken(token: Omit<RecentToken, "viewedAt">) {
  const clean = parseRecentTokens(JSON.stringify([{ ...token, viewedAt: Date.now() }]))[0];
  if (clean)
    tokens.update((items) =>
      [clean, ...items.filter((item) => item.chain !== clean.chain || item.token !== clean.token)].slice(0, 8),
    );
}
export function rememberSearch(query: string) {
  const q = parseRecentSearches(JSON.stringify([query]))[0];
  if (q) searches.update((items) => [q, ...items.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 6));
}
export const clearRecentTokens = () => tokens.update(() => []);
export const clearRecentSearches = () => searches.update(() => []);
