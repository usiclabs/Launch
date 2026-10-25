import assert from "node:assert/strict";
import test from "node:test";
import { publicClient } from "./chain";
import { CHAINS } from "./chainPublic";
test("Base indexing recovers when configured and B20 providers refuse requests", async (t) => {
  const previous = process.env.BASE_RPC_URL;
  process.env.BASE_RPC_URL = "https://primary.example.test";
  t.after(() => { if (previous === undefined) delete process.env.BASE_RPC_URL; else process.env.BASE_RPC_URL = previous; });
  const visited: string[] = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    const url = String(input);
    visited.push(url);
    if (new URL(url).origin !== new URL(CHAINS.base.rpcUrls.default.http[0]).origin) return new Response("Forbidden", { status: 403 });
    const body = JSON.parse(String(init?.body));
    const result = (r: {id: number}) => ({ jsonrpc: "2.0", id: r.id, result: [] });
    return Response.json(Array.isArray(body) ? body.map(result) : result(body));
  });
  assert.deepEqual(await publicClient("base").getLogs({ fromBlock: 1n, toBlock: 2n }), []);
  assert.ok(visited.some(url => new URL(url).origin === new URL(CHAINS.base.rpcUrls.default.http[0]).origin));
  assert.ok(visited.some(url => url.includes("primary.example.test")));
});
