import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJournal, upsertTransaction, type SavedTransaction } from "./transaction-journal.ts";
const tx: SavedTransaction = { hash: `0x${"a".repeat(64)}`, wallet: `0x${"b".repeat(40)}`, chain: "base", kind: "launch", label: "Launch TEST", state: "pending", createdAt: 100 };
test("journal validates corrupt storage and network/hash/account boundaries", () => {
  assert.deepEqual(parseJournal("broken"), []);
  for (const patch of [{ chain: "bad" }, { hash: "0x1" }, { wallet: "x" }, { kind: "sign" }, { state: "success" }, { token: "bad" }]) assert.deepEqual(parseJournal(JSON.stringify([{ ...tx, ...patch }])), []);
  assert.equal(parseJournal(JSON.stringify([tx, tx])).length, 1);
});
test("settlement replaces only the matching network transaction and preserves pending entries", () => {
  const rh = { ...tx, chain: "robinhood" as const };
  const rows = upsertTransaction([tx, rh], { ...tx, state: "confirmed" });
  assert.equal(rows.length, 2);
  assert.equal(rows.find(r => r.chain === "robinhood")?.state, "pending");
  assert.equal(rows.find(r => r.chain === "base")?.state, "confirmed");
});
