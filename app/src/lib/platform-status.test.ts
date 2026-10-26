import { test } from "node:test";
import assert from "node:assert/strict";
import { platformStatus } from "./platform-status.ts";
const healthy = { ok: true, db: true, transactions: true, uploads: true, chains: [{ chain: "base", delayed: false }] };
test("fresh available services produce a healthy snapshot", () => {
  assert.equal(platformStatus(healthy).healthy, true);
});
test("delayed indexing stays separate from transaction availability and never renders raw errors", () => {
  const snapshot = platformStatus({ ...healthy, ok: false, chains: [{ chain: "base", delayed: true, last_error: "SECRET RPC URL" }] });
  assert.equal(snapshot.healthy, false);
  assert.equal(snapshot.items[1].state, "available");
  assert.equal(snapshot.items[3].state, "delayed");
  assert.equal(JSON.stringify(snapshot).includes("SECRET"), false);
});
test("missing freshness and missing chains fail closed", () => {
  assert.equal(platformStatus({ ...healthy, chains: [{ chain: "base" }] }).healthy, false);
  assert.equal(platformStatus({ ...healthy, chains: [] }).healthy, false);
  assert.throws(() => platformStatus({ ok: true }));
});
test("database outage and disabled uploads are distinct", () => {
  const s = platformStatus({ ...healthy, db: false, uploads: false });
  assert.equal(s.items[0].state, "unavailable");
  assert.equal(s.items[2].state, "unavailable");
});
