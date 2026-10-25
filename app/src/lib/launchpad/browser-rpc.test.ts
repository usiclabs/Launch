import assert from "node:assert/strict";
import test from "node:test";
import { createPublicClient, http } from "viem";
import { browserRpc } from "./config";
import { CHAIN_KEYS, SITE_URL } from "../chainPublic";

test("wallet reads stay on the visitor's origin after a custom-domain migration", async (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  });
  for (const origin of ["https://www.launchxyz.xyz", "https://openlaunch-production.up.railway.app"]) {
    Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { origin } } });
    for (const key of CHAIN_KEYS) {
      assert.equal(browserRpc(key), `${origin}/api/rpc?chain=${key}`);
    }
  }
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(String(url), "https://openlaunch-production.up.railway.app/api/rpc?chain=base");
    const request = JSON.parse(String(init?.body));
    assert.equal(request.method, "eth_getBalance");
    return Response.json({ jsonrpc: "2.0", id: request.id, result: "0xde0b6b3a7640000" });
  });
  const client = createPublicClient({ transport: http(browserRpc("base"), { retryCount: 0 }) });
  assert.equal(await client.getBalance({ address: "0x0000000000000000000000000000000000000001" }), 10n ** 18n);
});

test("server rendering can initialize wallet transports without a browser", () => {
  for (const key of CHAIN_KEYS) assert.equal(browserRpc(key), `${SITE_URL}/api/rpc?chain=${key}`);
});
