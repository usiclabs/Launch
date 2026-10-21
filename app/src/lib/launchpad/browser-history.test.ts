import test from "node:test";
import assert from "node:assert/strict";
import { createHistoryStore, isContractAddress, parseRecentSearches, parseRecentTokens } from "./browser-history";
import { poolFeeExample } from "./trade-fee-summary";
import { buildPaletteGroups } from "../command-palette";

const now = 1700000000000;
const token = {
  chain: "base",
  token: `0x${"a".repeat(40)}`,
  name: "Test",
  symbol: "TEST",
  image: "https://example.com/logo.png",
  viewedAt: now,
};
test("recent tokens validate, expire, deduplicate per chain and strip untrusted fields", () => {
  const values = [
    { ...token, secret: "never" },
    token,
    { ...token, chain: "robinhood" },
    { ...token, viewedAt: now - 31 * 86400000 },
    { ...token, token: "invalid" },
    { ...token, chain: "other" },
  ];
  const parsed = parseRecentTokens(JSON.stringify(values), now);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[1].chain, "robinhood");
  assert.ok(!("secret" in parsed[0]));
  assert.equal(parseRecentTokens("{", now).length, 0);
  assert.equal(parseRecentTokens(JSON.stringify([{ ...token, viewedAt: now + 60001 }]), now).length, 0);
  assert.equal(parseRecentTokens(JSON.stringify([{ ...token, image: "javascript:alert(1)" }]), now)[0].image, null);
  assert.equal(
    parseRecentTokens(
      JSON.stringify(
        Array.from({ length: 12 }, (_, i) => ({ ...token, token: `0x${i.toString(16).padStart(40, "0")}` })),
      ),
      now,
    ).length,
    8,
  );
});
test("recent search history is bounded, trimmed, deduplicated and corruption safe", () => {
  assert.deepEqual(parseRecentSearches(JSON.stringify(["  BNKR  ", "bnkr", "x", null, 123, "LAUNCH"])), [
    "BNKR",
    "LAUNCH",
  ]);
  assert.equal(parseRecentSearches(JSON.stringify(Array.from({ length: 12 }, (_, i) => `token${i}`))).length, 6);
  assert.deepEqual(parseRecentSearches("null"), []);
  assert.deepEqual(parseRecentSearches("{"), []);
  assert.equal(isContractAddress(`  ${token.token} `), true);
  assert.equal(isContractAddress(token.token + "oops"), false);
});
test("history store preserves previous entries before first write and has stable snapshots", () => {
  let raw = JSON.stringify(["old"]);
  let notices = 0;
  const store = createHistoryStore({
    read: () => raw,
    write: (value) => {
      raw = value;
    },
    parse: parseRecentSearches,
  });
  const server = store.getServerSnapshot();
  store.subscribe(() => notices++);
  store.update((items) => ["new", ...items]);
  assert.deepEqual(store.getSnapshot().items, ["new", "old"]);
  const snapshot = store.getSnapshot();
  store.refresh();
  assert.equal(store.getSnapshot(), snapshot);
  assert.equal(notices, 1);
  assert.equal(server.ready, false);
  store.update(() => []);
  assert.equal(raw, "[]");
});
test("denied storage keeps usable in-memory history and clear still works", () => {
  const denied = () => {
    throw new Error("denied");
  };
  const store = createHistoryStore({ read: denied, write: denied, parse: parseRecentSearches });
  store.refresh();
  store.update(() => ["LAUNCH"]);
  store.refresh();
  assert.deepEqual(store.getSnapshot().items, ["LAUNCH"]);
  assert.equal(store.getSnapshot().storageError, true);
  store.update(() => []);
  assert.deepEqual(store.getSnapshot().items, []);
});
test("fee examples use pool fee pips and reject invalid data", () => {
  assert.equal(poolFeeExample(10000), 1);
  assert.equal(poolFeeExample(3000), 0.3);
  assert.equal(poolFeeExample(0), 0);
  assert.equal(poolFeeExample(10000, 250), 2.5);
  for (const value of [-1, NaN, Infinity, 1.5, 1000001]) assert.equal(poolFeeExample(value), null);
});
test("recent queries appear only before typing and remain search actions", () => {
  const options = { query: "", tokens: [], trending: [], theme: "dark" as const, recentSearches: ["BNKR", "LAUNCH"] };
  assert.deepEqual(
    buildPaletteGroups(options)[0].items.map((item) => item.kind),
    ["search", "search"],
  );
  assert.ok(!buildPaletteGroups({ ...options, query: "LAUNCH" }).some((group) => group.value === "Recent searches"));
});
