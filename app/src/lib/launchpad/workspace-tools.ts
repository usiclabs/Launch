import { parseLaunchDraft, type DraftDetails } from "./launch-draft.ts";
export type LaunchTemplate = {
  version: 1;
  label: string;
  details: DraftDetails;
  settings: {
    quoteKey: string;
    mcapPick: number | null;
    customMcap: string;
    feePips: number;
    beneficiary: "burn" | "me" | "custom";
    rows: { payout: string; pct: string }[];
  };
};
export function parseTemplate(raw: string): LaunchTemplate | null {
  if (raw.length > 20000) return null;
  try {
    const t = JSON.parse(raw);
    const d = parseLaunchDraft(
      JSON.stringify({
        ...t.details,
        name: t.details?.name === "" ? "Template" : t.details?.name,
        version: 1,
        savedAt: Date.now(),
      }),
    );
    const s = t.settings;
    if (
      t.version !== 1 ||
      typeof t.label !== "string" ||
      !t.label.trim() ||
      t.label.length > 60 ||
      !d ||
      !s ||
      typeof s.quoteKey !== "string" ||
      s.quoteKey.length > 40 ||
      ![0, 10000, 30000].includes(s.feePips) ||
      !["burn", "me", "custom"].includes(s.beneficiary) ||
      (s.mcapPick !== null &&
        (!Number.isFinite(s.mcapPick) || s.mcapPick <= 0)) ||
      typeof s.customMcap !== "string" ||
      !/^\d{0,15}(\.\d{0,8})?$/.test(s.customMcap) ||
      !Array.isArray(s.rows) ||
      s.rows.length > 7 ||
      !s.rows.every(
        (r: { payout: unknown; pct: unknown }) =>
          typeof r.payout === "string" &&
          r.payout.length <= 42 &&
          typeof r.pct === "string" &&
          /^\d{0,3}(\.\d{0,2})?$/.test(r.pct),
      )
    )
      return null;
    const { version: _v, savedAt: _at, ...details } = d;
    void _v;
    void _at;
    if (t.details.name === "") details.name = "";
    return {
      version: 1,
      label: t.label.trim(),
      details,
      settings: {
        quoteKey: s.quoteKey,
        mcapPick: s.mcapPick,
        customMcap: s.customMcap,
        feePips: s.feePips,
        beneficiary: s.beneficiary,
        rows: s.rows.map((r: { payout: string; pct: string }) => ({
          payout: r.payout,
          pct: r.pct,
        })),
      },
    };
  } catch {
    return null;
  }
}
export function csv(rows: unknown[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let s = String(value ?? "");
          if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
export function filterTrades<
  T extends { is_buy: boolean; trader: string | null; amount0: string },
>(
  rows: T[],
  side: string,
  wallet: string,
  minimum: string,
  decimals: number,
): T[] {
  const min = Number(minimum || 0);
  return rows.filter(
    (r) =>
      (side === "all" || r.is_buy === (side === "buy")) &&
      (!wallet.trim() ||
        (r.trader ?? "").toLowerCase().includes(wallet.trim().toLowerCase())) &&
      Number.isFinite(min) &&
      min >= 0 &&
      Math.abs(Number(r.amount0)) / 10 ** decimals >= min,
  );
}
