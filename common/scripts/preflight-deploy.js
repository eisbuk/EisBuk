#!/usr/bin/env node

// Fails before a production deploy unless it would use the intended toolchain
// (eisbuk/EisBuk#986):
// - the Firebase CLI that deploy-firebase.expect runs (`npx firebase` from
//   packages/client) matches the repository's exact pin;
// - the local Node version can run the supported toolchain;
// - the functions are declared for Node 22 (packages/functions engines.node).
// Usage: node common/scripts/preflight-deploy.js   (after `rush install`)

const childProcess = require("child_process");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..", "..");
const EXPECTED_ENGINES_NODE = "22";
const EXPECTED_CLI_VERSION = require("../../packages/client/package.json")
  .dependencies["firebase-tools"];

/** Returns a list of problems (empty if the toolchain is the intended one) */
const checkToolchain = ({
  cliVersion,
  enginesNode,
  nodeVersion = process.versions.node,
}) => {
  const problems = [];
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(cliVersion || "");
  if (!match) {
    problems.push(`firebase CLI version not recognised: "${cliVersion}"`);
  } else {
    const [major, minor] = [Number(match[1]), Number(match[2])];
    if (major < 13 || (major === 13 && minor < 11)) {
      problems.push(
        `firebase CLI is ${cliVersion}, Node 22 functions require >= 13.11`,
      );
    } else if (cliVersion !== EXPECTED_CLI_VERSION) {
      problems.push(
        `firebase CLI is ${cliVersion}, expected the pinned ${EXPECTED_CLI_VERSION}`,
      );
    }
  }
  const nodeMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(nodeVersion || "");
  const supportedNode =
    nodeMatch &&
    ((Number(nodeMatch[1]) === 22 && Number(nodeMatch[2]) >= 12) ||
      (Number(nodeMatch[1]) === 24 && Number(nodeMatch[2]) >= 11));
  if (!supportedNode) {
    problems.push(
      `local Node is ${nodeVersion}, expected Node >=22.12 <23 or >=24.11 <25`,
    );
  }
  if (enginesNode !== EXPECTED_ENGINES_NODE) {
    problems.push(
      `packages/functions engines.node is "${enginesNode}", expected "${EXPECTED_ENGINES_NODE}"`,
    );
  }
  return problems;
};

const main = () => {
  let cliVersion;
  try {
    // Same resolution as the deploy wrapper, but never install anything.
    // (Not `npx --no firebase --version`: npm then answers --version itself.)
    cliVersion = childProcess
      .execFileSync("npx", ["--yes=false", "firebase", "--version"], {
        cwd: path.join(REPO_ROOT, "packages", "client"),
        encoding: "utf8",
        timeout: 120000,
      })
      .trim()
      .split("\n")
      .pop();
  } catch (err) {
    cliVersion = `(could not run: ${err.message})`;
  }
  const enginesNode = require(
    path.join(REPO_ROOT, "packages", "functions", "package.json"),
  ).engines.node;
  console.log(`firebase CLI (npx firebase in packages/client): ${cliVersion}`);
  console.log(`packages/functions engines.node: ${enginesNode}`);
  console.log(`local Node: ${process.versions.node}`);
  const problems = checkToolchain({ cliVersion, enginesNode });
  if (problems.length) {
    console.error("DEPLOY PREFLIGHT FAILED:");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log("Deploy preflight passed");
};

if (require.main === module) main();

module.exports = { checkToolchain };
