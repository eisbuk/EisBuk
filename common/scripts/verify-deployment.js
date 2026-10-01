#!/usr/bin/env node

// Checks that a deploy actually reached production (eisbuk/EisBuk#986): a green
// `firebase deploy` is not enough. Read-only: it fetches the public sites and lists
// the Cloud Functions (GET). It never writes anything.
//
// It fails (exit code 1) unless:
// - every client site serves a bundle that contains the expected release id
//   (REACT_APP_SENTRY_RELEASE, which the build embeds in the bundle);
// - every redirect site redirects where firebase.json says;
// - every function exported by the built functions bundle exists in production,
//   is ACTIVE, has REACT_APP_SENTRY_RELEASE equal to the expected release in its
//   environment (the deploy writes it to packages/functions/.env), and, when
//   given, runs on --runtime and was updated at or after --since.
// Functions that exist in production but not in the bundle are only listed: the
// deploy answers N when asked to delete them.
//
// Usage (build the functions first: cd packages/functions && rushx build):
//   node common/scripts/verify-deployment.js --release 2026-10-02-2d442ec7 \
//     [--runtime nodejs22] [--since 2026-10-02T10:00:00Z] [--project eisbuk] \
//     [--functions-bundle packages/functions/dist/index.js]
//
// Credentials, for the functions list: ACCESS_TOKEN (for example
// `ACCESS_TOKEN=$(gcloud auth print-access-token)`), or a service account key file
// in GOOGLE_APPLICATION_CREDENTIALS.

const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CLIENT_SITES = ["https://igoriceteam.web.app", "https://eisbuk.web.app"];
const REDIRECT_SITES = {
  "https://igorice.web.app": "https://igoriceteam.web.app",
};
const DEFAULT_BUNDLE = path.join(
  __dirname,
  "..",
  "..",
  "packages",
  "functions",
  "dist",
  "index.js",
);
// The CDN serves the new version right after the release, but give it some slack
const HOSTING_ATTEMPTS = 6;
const HOSTING_RETRY_DELAY_MS = 20000;
// Every request, body included, must finish within this time...
const REQUEST_TIMEOUT_MS =
  Number(process.env.VERIFY_REQUEST_TIMEOUT_MS) || 30000;
// ...and the whole verification within this one
const DEADLINE_MS = Number(process.env.VERIFY_DEADLINE_MS) || 10 * 60 * 1000;
// Loading the functions bundle to list its exports must finish within this time
const BUNDLE_TIMEOUT_MS = Number(process.env.VERIFY_BUNDLE_TIMEOUT_MS) || 60000;
// Only overridden by the tests
const FUNCTIONS_API =
  process.env.VERIFY_FUNCTIONS_API || "https://cloudfunctions.googleapis.com";

const OPTIONS = {
  "--release": "release",
  "--since": "since",
  "--runtime": "runtime",
  "--project": "project",
  "--functions-bundle": "functionsBundle",
};

const parseArgs = (argv) => {
  const args = { project: "eisbuk", functionsBundle: DEFAULT_BUNDLE };
  for (let i = 0; i < argv.length; i += 2) {
    const name = OPTIONS[argv[i]];
    const value = argv[i + 1];
    if (!name || !value) throw new Error(`Bad argument: ${argv[i]}`);
    args[name] = value;
  }
  if (!args.release) throw new Error("--release is required");
  if (args.since && isNaN(Date.parse(args.since))) {
    throw new Error(`--since is not a date: ${args.since}`);
  }
  return args;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** fetch() whose response body is read too before the deadline */
const fetchWithDeadline = async (
  url,
  init = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const body = await res.text();
    return { res, body };
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`${url}: no complete response within ${timeoutMs} ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

const getAccessToken = async () => {
  if (process.env.ACCESS_TOKEN) return process.env.ACCESS_TOKEN;
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile) {
    throw new Error("Set ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS");
  }
  const key = JSON.parse(fs.readFileSync(keyFile, "utf8"));
  const tokenUri = key.token_uri || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: tokenUri,
    iat: now,
    exp: now + 600,
  })}`;
  const signature = crypto
    .sign("RSA-SHA256", Buffer.from(unsigned), key.private_key)
    .toString("base64url");
  const { res, body } = await fetchWithDeadline(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token request failed: HTTP ${res.status} ${body}`);
  }
  return JSON.parse(body).access_token;
};

/**
 * The functions the deploy should have produced, as "region/name", read from the
 * exports of the built bundle with the rules firebase-functions' own loader uses
 * when the Firebase CLI discovers them (runtime/loader.js extractStack): a
 * function with an `__endpoint` object is a Cloud Function, any other object is
 * searched recursively and its functions are named "<key>-<name>".
 * The bundle is loaded in a child process with no credentials and the emulator
 * hosts set, so nothing it initialises can reach a real project. The child is
 * killed with SIGKILL if it does not answer in time (even if stopped, or
 * ignoring SIGTERM), and nothing here blocks the event loop meanwhile.
 */
const loadExpectedFunctions = async (bundle) => {
  if (!fs.existsSync(bundle)) {
    throw new Error(`${bundle} not found: build the functions first`);
  }
  const script = `
    const out = [];
    const extract = (mod, prefix) => {
      for (const [name, val] of Object.entries(mod)) {
        if (typeof val === "function" && val.__endpoint && typeof val.__endpoint === "object") {
          for (const region of val.__endpoint.region || ["us-central1"]) {
            out.push(region + "/" + prefix + name);
          }
        } else if (typeof val === "object" && val !== null) {
          extract(val, prefix + name + "-");
        }
      }
    };
    extract(require(process.argv[1]), "");
    process.stdout.write(JSON.stringify(out));
    process.exit(0);
  `;
  const child = childProcess.spawn(
    process.execPath,
    ["-e", script, path.resolve(bundle)],
    {
      cwd: path.dirname(path.resolve(bundle)),
      env: {
        PATH: process.env.PATH,
        GCLOUD_PROJECT: "demo-verify-deployment",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:1",
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:1",
      },
    },
  );
  // Whatever way this process ends (e.g. the overall deadline), the child must not
  // outlive it
  const killChild = () => child.kill("SIGKILL");
  process.on("exit", killChild);
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (d) => (stdout += d));
  child.stderr.on("data", (d) => (stderr += d));
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, BUNDLE_TIMEOUT_MS);
  const [code, signal] = await new Promise((resolve) => {
    child.on("error", (err) => {
      stderr += err.message;
      resolve([null, null]);
    });
    child.on("close", (c, s) => resolve([c, s]));
  }).finally(() => {
    clearTimeout(timer);
    process.removeListener("exit", killChild);
  });
  if (timedOut) {
    throw new Error(
      `Listing the functions in ${bundle} took more than ${BUNDLE_TIMEOUT_MS} ms`,
    );
  }
  if (code !== 0) {
    throw new Error(
      `Could not list the functions in ${bundle} (exit ${code}, ${signal}): ${stderr}`,
    );
  }
  const expected = JSON.parse(stdout);
  if (!expected.length) throw new Error(`${bundle} exports no functions`);
  return expected;
};

const listFunctions = async (project, token, api = FUNCTIONS_API) => {
  const functions = [];
  let pageToken = "";
  do {
    const url = new URL(`${api}/v1/projects/${project}/locations/-/functions`);
    url.searchParams.set("pageSize", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const { res, body } = await fetchWithDeadline(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Listing functions failed: HTTP ${res.status} ${body}`);
    }
    const page = JSON.parse(body);
    if (page.unreachable && page.unreachable.length) {
      throw new Error(
        `Listing functions is incomplete, unreachable: ${page.unreachable.join(
          ", ",
        )}`,
      );
    }
    functions.push(...(page.functions || []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return functions;
};

/** Returns a list of problems (empty if production matches) */
const checkFunctions = (functions, expected, { release, since, runtime }) => {
  const problems = [];
  const sinceMs = since ? Date.parse(since) : undefined;
  const byId = new Map(
    functions.map((fn) => {
      const [, , , region, , name] = fn.name.split("/");
      return [`${region}/${name}`, fn];
    }),
  );
  console.log(
    `\nCloud Functions (expecting ${expected.length} functions with release ${release}):`,
  );
  for (const id of expected) {
    const fn = byId.get(id);
    if (!fn) {
      console.log(`  FAIL  ${id}  missing in production`);
      problems.push(`function ${id}: missing in production`);
      continue;
    }
    const deployedRelease = (fn.environmentVariables || {})
      .REACT_APP_SENTRY_RELEASE;
    const wrong = [];
    if (fn.status !== "ACTIVE") wrong.push(`status ${fn.status}`);
    if (deployedRelease !== release) wrong.push(`release ${deployedRelease}`);
    if (runtime && fn.runtime !== runtime) wrong.push(`runtime ${fn.runtime}`);
    if (sinceMs !== undefined && !(Date.parse(fn.updateTime) >= sinceMs)) {
      wrong.push(`updated before ${since}`);
    }
    console.log(
      `  ${wrong.length ? "FAIL" : "ok  "}  ${id}  ${fn.runtime}  ${
        fn.status
      }  updated ${fn.updateTime}  release ${deployedRelease}`,
    );
    if (wrong.length) problems.push(`function ${id}: ${wrong.join(", ")}`);
  }
  for (const [id, fn] of byId) {
    if (!expected.includes(id)) {
      console.log(
        `  note  ${id}  not in the source (left in place), ${fn.runtime}, updated ${fn.updateTime}`,
      );
    }
  }
  return problems;
};

/** Returns a problem string, or undefined if the site serves the expected release */
const checkClientSite = async (
  site,
  release,
  timeoutMs = REQUEST_TIMEOUT_MS,
) => {
  const { res, body: html } = await fetchWithDeadline(
    `${site}/?verify-deployment=${Date.now()}`,
    { headers: { "cache-control": "no-cache" } },
    timeoutMs,
  );
  if (!res.ok) return `${site}: HTTP ${res.status}`;
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(
    (m) => m[1],
  );
  if (!scripts.length) return `${site}: no <script src> in index.html`;
  const releases = new Set();
  for (const src of scripts) {
    const { res: jsRes, body: js } = await fetchWithDeadline(
      new URL(src, site).href,
      { headers: { "cache-control": "no-cache" } },
      timeoutMs,
    );
    if (!jsRes.ok) return `${site}: ${src} HTTP ${jsRes.status}`;
    if (js.includes(`"${release}"`)) {
      console.log(`  ok    ${site}  ${src} contains "${release}"`);
      return undefined;
    }
    for (const m of js.matchAll(/"(\d{4}-\d{2}-\d{2}-[0-9a-f]{7,40})"/g)) {
      releases.add(m[1]);
    }
  }
  return `${site}: serves ${scripts.join(", ")} with release ${
    [...releases].join(", ") || "unknown"
  }, not ${release}`;
};

const checkRedirect = async (from, to) => {
  const { res } = await fetchWithDeadline(`${from}/`, { redirect: "manual" });
  const location = res.headers.get("location");
  if (
    res.status !== 301 ||
    !location ||
    new URL(location).href !== new URL(to).href
  ) {
    return `${from}: expected 301 to ${to}, got ${res.status} ${location}`;
  }
  console.log(`  ok    ${from}  301 -> ${location}`);
  return undefined;
};

const checkHosting = async (release) => {
  let problems = [];
  for (let attempt = 1; attempt <= HOSTING_ATTEMPTS; attempt++) {
    console.log(
      `\nHosting (expecting release ${release}), attempt ${attempt}/${HOSTING_ATTEMPTS}:`,
    );
    problems = [];
    const checks = [
      ...CLIENT_SITES.map((site) => () => checkClientSite(site, release)),
      ...Object.entries(REDIRECT_SITES).map(
        ([from, to]) =>
          () =>
            checkRedirect(from, to),
      ),
    ];
    for (const check of checks) {
      const problem = await check().catch((err) => err.message);
      if (problem) {
        console.log(`  FAIL  ${problem}`);
        problems.push(problem);
      }
    }
    if (!problems.length || attempt === HOSTING_ATTEMPTS) break;
    await sleep(HOSTING_RETRY_DELAY_MS);
  }
  return problems;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const expected = await loadExpectedFunctions(args.functionsBundle);
  const token = await getAccessToken();
  const problems = [
    ...checkFunctions(await listFunctions(args.project, token), expected, args),
    ...(await checkHosting(args.release)),
  ];
  if (problems.length) {
    console.error(
      `\nDEPLOYMENT VERIFICATION FAILED (${problems.length} problems):`,
    );
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(`\nDeployment verified: production runs release ${args.release}`);
  process.exit(0);
};

if (require.main === module) {
  // Only an explicit success exits with 0, never an event loop that ran dry
  process.exitCode = 1;
  // A signal would end the process without the "exit" listeners that kill the
  // bundle process: exit explicitly instead (128 + signal number)
  for (const [signal, status] of [
    ["SIGINT", 130],
    ["SIGTERM", 143],
  ]) {
    process.on(signal, () => {
      console.error(`DEPLOYMENT VERIFICATION FAILED: interrupted by ${signal}`);
      process.exit(status);
    });
  }
  setTimeout(() => {
    console.error(
      `DEPLOYMENT VERIFICATION FAILED: not finished within ${DEADLINE_MS} ms`,
    );
    process.exit(1);
  }, DEADLINE_MS).unref();
  main().catch((err) => {
    console.error(`DEPLOYMENT VERIFICATION FAILED: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  fetchWithDeadline,
  getAccessToken,
  loadExpectedFunctions,
  listFunctions,
  checkFunctions,
  checkClientSite,
};
