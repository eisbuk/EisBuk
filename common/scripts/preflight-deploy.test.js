// Tests for preflight-deploy.js. Run with: node --test common/scripts/

const assert = require("assert");
const { test } = require("node:test");

const { checkToolchain } = require("./preflight-deploy");

test("firebase-tools 13.35.1 with Node 22 functions passes", () => {
  assert.deepStrictEqual(
    checkToolchain({ cliVersion: "13.35.1", enginesNode: "22" }),
    [],
  );
  assert.deepStrictEqual(
    checkToolchain({ cliVersion: "13.11.0", enginesNode: "22" }),
    [],
  );
});

test("other CLI versions fail", () => {
  for (const cliVersion of [
    "12.2.1",
    "13.10.2",
    "14.0.0",
    "15.32.1",
    "",
    undefined,
    "(could not run: npx canceled)",
  ]) {
    assert.strictEqual(
      checkToolchain({ cliVersion, enginesNode: "22" }).length,
      1,
      String(cliVersion),
    );
  }
});

test("functions not declared for Node 22 fail", () => {
  for (const enginesNode of ["18", "20", ">=22", undefined]) {
    assert.deepStrictEqual(
      checkToolchain({ cliVersion: "13.35.1", enginesNode }),
      [`packages/functions engines.node is "${enginesNode}", expected "22"`],
    );
  }
});
