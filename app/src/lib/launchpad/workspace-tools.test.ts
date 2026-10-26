import test from "node:test";
import assert from "node:assert/strict";
import { csv, filterTrades, parseTemplate } from "./workspace-tools.ts";
import { parseAlerts, targetReached } from "./price-alerts.ts";
const details = {
  name: "Demo",
  symbol: "DEMO",
  description: "",
  image: "",
  banner: "",
  website: "",
  x: "",
  chain: "base",
};
const template = {
  version: 1,
  label: "Demo",
  details,
  settings: {
    quoteKey: "eth",
    mcapPick: 5000,
    customMcap: "",
    feePips: 10000,
    beneficiary: "custom",
    rows: [{ payout: "0x" + "a".repeat(40), pct: "100" }],
  },
};
test("templates round-trip supported settings and discard extra untrusted fields", () => {
  const t = parseTemplate(
    JSON.stringify({
      ...template,
      privateKey: "not-kept",
      settings: { ...template.settings, firstBuy: "1" },
    }),
  );
  assert.equal(t?.details.name, "Demo");
  assert.equal(t?.settings.rows[0].pct, "100");
  assert.ok(!JSON.stringify(t).includes("privateKey"));
  assert.ok(!JSON.stringify(t).includes("firstBuy"));
});
test("templates reject malformed fees, oversized imports, missing fields and invalid amounts", () => {
  for (const s of [
    "invalid",
    "x".repeat(20001),
    JSON.stringify({
      ...template,
      settings: { ...template.settings, feePips: 999 },
    }),
    JSON.stringify({
      ...template,
      details: { ...details, name: "x".repeat(33) },
    }),
    JSON.stringify({
      ...template,
      settings: { ...template.settings, customMcap: "-1" },
    }),
  ])
    assert.equal(parseTemplate(s), null);
});
test("CSV escapes quotes, linebreaks, and spreadsheet formulas", () => {
  assert.equal(csv([["=1+1", 'a"b', "a\nb"]]), '"\'=1+1","a""b","a\nb"');
});
test("trade filters combine side, wallet and quote-size with token decimals", () => {
  const rows = [
    { is_buy: true, trader: "0xABC", amount0: "-1500000" },
    { is_buy: false, trader: null, amount0: "2000000" },
  ];
  assert.equal(filterTrades(rows, "buy", "abc", "1", 6).length, 1);
  assert.equal(filterTrades(rows, "all", "", "2", 6).length, 1);
  assert.equal(filterTrades(rows, "all", "", "-1", 6).length, 0);
  assert.equal(filterTrades(rows, "all", "", "NaN", 6).length, 0);
});
const alert = {
  id: "one",
  chain: "base",
  token: "0x" + "a".repeat(40),
  symbol: "DEMO",
  metric: "mcap",
  direction: "above",
  target: 100,
  firedAt: null,
};
test("alerts validate storage and fail closed on unhealthy or unpriced data", () => {
  const a = parseAlerts(JSON.stringify([alert]))[0];
  assert.ok(a);
  assert.equal(targetReached(a, 100, true), true);
  assert.equal(targetReached(a, 101, false), false);
  assert.equal(targetReached(a, null, true), false);
  assert.equal(targetReached({ ...a, firedAt: 1 }, 200, true), false);
  assert.equal(
    parseAlerts(JSON.stringify([{ ...alert, target: -1 }])).length,
    0,
  );
  assert.equal(parseAlerts("bad").length, 0);
});
