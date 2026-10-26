import { test } from "node:test";
import assert from "node:assert/strict";
import { healthBody, lagBlocks } from "./health.ts";

const base = { dbConfigured: true, dbOk: true, chain: true, launchpad: true, uploads: true };
const sync = (o: Partial<{ cursor_block: number | null; head_block: number | null; last_run_at: string | null; last_error: string | null }> = {}) => ({
  cursor_block: 100,
  head_block: 110,
  last_run_at: new Date().toISOString(),
  last_error: null,
  ...o,
});

test("healthy → 200 ok", () => {
  const r = healthBody({ ...base, sync: sync() });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.deepEqual(r.body.alerts, []);
  assert.equal(r.body.sync.lag_blocks, 10);
});

test("db configured but unreachable → 503", () => {
  const r = healthBody({ ...base, dbOk: false });
  assert.equal(r.status, 503);
  assert.deepEqual(r.body.alerts, ["db_unreachable"]);
});

test("db unconfigured → alive, db:false, no alert", () => {
  const r = healthBody({ ...base, dbConfigured: false, dbOk: false });
  assert.equal(r.status, 200);
  assert.equal(r.body.db, false);
  assert.deepEqual(r.body.alerts, []);
});

test("missing image storage is reported without marking the HTTP service down", () => {
  const r = healthBody({ ...base, uploads: false, sync: sync() });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, false);
  assert.equal(r.body.uploads, false);
  assert.deepEqual(r.body.alerts, ["image_uploads_off"]);
});

test("lag beyond limit / last_error → ok:false but 200", () => {
  const r = healthBody({ ...base, sync: sync({ head_block: 1000 }) });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.alerts, ["sync_lag"]);
  const e = healthBody({ ...base, sync: sync({ last_error: "boom" }) });
  assert.deepEqual(e.body.alerts, ["sync_error"]);
});

test("lagBlocks never negative / null-safe", () => {
  assert.equal(lagBlocks(5, 10), 0);
  assert.equal(lagBlocks(null, 10), null);
});


test("stalled indexer alerts even when its stored block gap is small", () => {
  const now = Date.parse("2026-10-26T00:00:00Z");
  const r = healthBody({ ...base, now, sync: sync({ last_run_at: "2026-10-25T23:40:00Z" }) });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, false);
  assert.equal(r.body.chains[0].delayed, true);
  assert.deepEqual(r.body.alerts, ["sync_stale"]);
});

test("fresh chains use their own lag limits; missing timestamps cannot look current", () => {
  const r = healthBody({ ...base, chains: [{ ...sync(), chain: "base" }, { ...sync({ last_run_at: null }), chain: "robinhood" }], lagAlertBlocks: chain => chain === "base" ? 5 : 20 });
  assert.equal(r.body.chains[0].delayed, true);
  assert.equal(r.body.chains[1].delayed, true);
  assert.ok(r.body.alerts.includes("sync_stale"));
  assert.ok(r.body.alerts.includes("sync_lag"));
});
