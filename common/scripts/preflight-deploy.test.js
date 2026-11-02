// Tests for preflight-deploy.js. Run with: node --test common/scripts/

const assert = require("assert");
const { test } = require("node:test");

const { checkToolchain } = require("./preflight-deploy");

const cliPin = require("../../packages/client/package.json").dependencies[
  "firebase-tools"
];

test("the pinned Firebase CLI with Node 22 functions passes", () => {
  assert.deepStrictEqual(
    checkToolchain({ cliVersion: cliPin, enginesNode: "22" }),
    [],
  );
  assert.deepStrictEqual(
    checkToolchain({
      cliVersion: cliPin,
      nodeVersion: "24.11.0",
      enginesNode: "22",
    }),
    [],
  );
});

test("other CLI versions fail", () => {
  for (const cliVersion of [
    "12.2.1",
    "13.10.2",
    "14.0.0",
    "13.35.1",
    "15.30.2",
    `${cliPin}-preview`,
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
      checkToolchain({ cliVersion: cliPin, enginesNode }),
      [`packages/functions engines.node is "${enginesNode}", expected "22"`],
    );
  }
});

test("unsupported local Node versions fail before deployment", () => {
  for (const nodeVersion of [
    "18.20.8",
    "20.20.0",
    "22.11.0",
    "23.0.0",
    "24.10.0",
    "25.0.0",
    "",
  ]) {
    assert.strictEqual(
      checkToolchain({ cliVersion: cliPin, enginesNode: "22", nodeVersion })
        .length,
      1,
      nodeVersion,
    );
  }
  for (const nodeVersion of ["22.12.0", "22.22.0", "24.11.0", "24.16.0"]) {
    assert.deepStrictEqual(
      checkToolchain({ cliVersion: cliPin, enginesNode: "22", nodeVersion }),
      [],
    );
  }
});
