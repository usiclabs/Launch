import test from "node:test";
import assert from "node:assert/strict";
import { DRAFT_MAX_AGE, hasDraftContent, parseLaunchDraft } from "./launch-draft";
import { cropRect } from "./image-crop";
import { marketCookie, parseMarketPreferences } from "./market-preferences";

const now = 100000000000;
const details = { name: "LAUNCH test", symbol: "TEST", description: "", image: "https://example.com/logo.webp", banner: "", website: "", x: "", chain: "base" as const };
test("drafts restore identity and hosted artwork without restoring spending or wallet actions", () => {
  const restored = parseLaunchDraft(JSON.stringify({ ...details, version: 1, savedAt: now, privateKey: "never", firstBuy: "500" }), now);
  assert.equal(restored?.image, details.image);
  assert.equal(restored?.name, details.name);
  assert.ok(!("privateKey" in restored!));
  assert.ok(!("firstBuy" in restored!));
  assert.equal(hasDraftContent({ ...details, name: "", symbol: "", image: "" }), false);
});
test("corrupt, expired, future and oversized browser drafts cannot overwrite the form", () => {
  const raw = (changes = {}) => JSON.stringify({ ...details, version: 1, savedAt: now, ...changes });
  for (const value of ["{", "null", raw({ name: 5 }), raw({ name: "x".repeat(33) }), raw({ chain: "invalid" }), raw({ version: 2 }), raw({ savedAt: now - DRAFT_MAX_AGE - 1 }), raw({ savedAt: now + 60001 })]) assert.equal(parseLaunchDraft(value, now), null);
});
test("square and banner crop previews export exactly the selected source region", () => {
  assert.deepEqual(cropRect(1200, 600, 1), {x:300,y:0,width:600,height:600});
  assert.deepEqual(cropRect(1200, 600, 3, 1, 50, 100), {x:0,y:200,width:1200,height:400});
  assert.deepEqual(cropRect(1200, 600, 1, 2, 100, 0), {x:900,y:0,width:300,height:300});
  for (const [w,h] of [[1,10000],[10000,1],[123,456]]) for (const aspect of [1,3]) {
    const r = cropRect(w,h,aspect,3,100,100);
    assert.ok(r.x >= 0 && r.y >= 0 && r.x+r.width <= w+.0001 && r.y+r.height <= h+.0001);
    assert.ok(Math.abs(r.width/r.height-aspect) < .0001);
  }
  assert.throws(()=>cropRect(0,200,1));
});
test("market preferences round-trip and invalid cookies fall back cleanly", () => {
  const p = {sort:"volume" as const,window:"24h" as const,chain:"base" as const,filter:null};
  assert.deepEqual(parseMarketPreferences(marketCookie(p).split(";")[0].split("=")[1]),p);
  for (const v of ["%", "null", "{}", encodeURIComponent(JSON.stringify({...p,chain:"other"})), encodeURIComponent(JSON.stringify({...p,sort:"random"}))]) assert.equal(parseMarketPreferences(v),null);
});
