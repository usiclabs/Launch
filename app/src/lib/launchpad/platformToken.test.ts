import { test } from "node:test";
import assert from "node:assert/strict";
import { PLATFORM_TOKEN, isPlatformToken, TOKEN_PREVIEW } from "./platformToken.ts";
test("BNKR matching is chain scoped and never relabels old tokens", () => {
  assert.equal(isPlatformToken("base", PLATFORM_TOKEN.addresses.base.toUpperCase().replace("0X", "0x")), true);
  assert.equal(isPlatformToken("robinhood", PLATFORM_TOKEN.addresses.robinhood), true);
  assert.equal(isPlatformToken("base", PLATFORM_TOKEN.addresses.robinhood), false);
  assert.equal(isPlatformToken("robinhood", PLATFORM_TOKEN.addresses.base), false);
  for (const address of ["0x6ac18bcf4ede02591d4917452700ea5eaaea13c1", "0x5f980dcfc4c0fa3911554cf5ab288ed0eb13dba3", "0xd1b0d44e4f6ed940fcc7a9f59bf30daf62ccfe3d"]) {
    assert.equal(isPlatformToken("base", address), false);
    assert.equal(isPlatformToken("robinhood", address), false);
  }
  assert.equal(isPlatformToken("arc", PLATFORM_TOKEN.addresses.base), false);
  assert.equal(TOKEN_PREVIEW, true);
});
