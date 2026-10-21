/** Browser-only draft data. Transaction hashes, signatures and wallet credentials are never included. */
export const LAUNCH_DRAFT_KEY = "launch:draft:v1";
export const DRAFT_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
export type LaunchDraft = {
  version: 1; savedAt: number;
  name: string; symbol: string; description: string; image: string; banner: string; website: string; x: string;
  chain: "base" | "robinhood" | "arc";
};
export type DraftDetails = Omit<LaunchDraft, "version" | "savedAt">;

export function hasDraftContent(draft: DraftDetails): boolean {
  return [draft.name, draft.symbol, draft.description, draft.image, draft.banner, draft.website, draft.x].some(v => v.trim().length > 0);
}

export function parseLaunchDraft(raw: string | null, now = Date.now()): LaunchDraft | null {
  if (!raw || raw.length > 16000) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || d.version !== 1 || !Number.isFinite(d.savedAt) || d.savedAt > now + 60000 || now - d.savedAt > DRAFT_MAX_AGE) return null;
    if (!["base", "robinhood", "arc"].includes(d.chain)) return null;
    const limits = { name: 32, symbol: 40, description: 280, image: 2048, banner: 2048, website: 2048, x: 200 } as const;
    for (const [key, max] of Object.entries(limits)) if (typeof d[key] !== "string" || d[key].length > max) return null;
    const clean: LaunchDraft = { version: 1, savedAt: d.savedAt, chain: d.chain, name: d.name, symbol: d.symbol, description: d.description, image: d.image, banner: d.banner, website: d.website, x: d.x };
    return hasDraftContent(clean) ? clean : null;
  } catch { return null; }
}
