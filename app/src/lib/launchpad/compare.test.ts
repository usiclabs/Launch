import test from "node:test";
import assert from "node:assert/strict";
import { compareQuery, parseCompareKeys } from "./compare.ts";
const a = `0x${"a".repeat(40)}`;
const b = `0x${"b".repeat(40)}`;
test("comparison validates, normalizes and deduplicates by network and address", () => {
  const keys = parseCompareKeys(`bad:${a},base:bad,base:${a},base:${a.toUpperCase().replace('0X','0x')},robinhood:${a},base:${b},arc:${b}`);
  assert.equal(keys.length, 3);
  assert.deepEqual(keys.map(k => k.chain), ["base", "robinhood", "base"]);
  assert.deepEqual(parseCompareKeys(compareQuery(keys)), keys);
});
