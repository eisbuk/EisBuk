#!/usr/bin/env node

// Checks that a deploy actually reached production (eisbuk/EisBuk#986): a green
// `firebase deploy` is not enough. Read-only: it fetches the public sites and lists
// the Cloud Functions (GET). It never writes anything.
//
// It fails (exit code 1) unless:
// - every client site serves a bundle that contains the expected release id
//   (REACT_APP_SENTRY_RELEASE, which the build embeds in the bundle);
// - every redirect site redirects where firebase.json says;
// - every Cloud Function deployed by the Firebase CLI (except the --ignore-function
//   ones) is ACTIVE, has REACT_APP_SENTRY_RELEASE equal to the expected release in
//   its environment (the deploy writes it to packages/functions/.env), and, when
//   given, runs on --runtime and was updated at or after --since.
//
// Usage:
//   node common/scripts/verify-deployment.js --release 2026-10-02-2d442ec7 \
//     [--since 2026-10-02T10:00:00Z] [--runtime nodejs22] \
//     [--ignore-function europe-west6/someOldFunction ...] [--project eisbuk]
//
// Credentials, for the functions list: ACCESS_TOKEN (for example
// `ACCESS_TOKEN=$(gcloud auth print-access-token)`), or a service account key file
// in GOOGLE_APPLICATION_CREDENTIALS.

const crypto = require("crypto");
const fs = require("fs");

const CLIENT_SITES = ["https://igoriceteam.web.app", "https://eisbuk.web.app"];
const REDIRECT_SITES = {
  "https://igorice.web.app": "https://igoriceteam.web.app",
};
// The CDN serves the new version right after the release, but give it some slack
const HOSTING_ATTEMPTS = 6;
const HOSTING_RETRY_DELAY_MS = 20000;

const OPTIONS = {
  "--release": "release",
  "--since": "since",
  "--runtime": "runtime",
  "--project": "project",
  "--ignore-function": "ignoreFunction",
};

const parseArgs = (argv) => {
  const args = { project: "eisbuk", ignoreFunction: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const name = OPTIONS[argv[i]];
    const value = argv[i + 1];
    if (!name || !value) throw new Error(`Bad argument: ${argv[i]}`);
    if (Array.isArray(args[name])) args[name].push(value);
    else args[name] = value;
  }
  if (!args.release) throw new Error("--release is required");
  if (args.since && isNaN(Date.parse(args.since))) {
    throw new Error(`--since is not a date: ${args.since}`);
  }
  return args;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Token request failed: HTTP ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()).access_token;
};

const listFunctions = async (project, token) => {
  const functions = [];
  let pageToken = "";
  do {
    const url = new URL(
      `https://cloudfunctions.googleapis.com/v1/projects/${project}/locations/-/functions`,
    );
    url.searchParams.set("pageSize", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(
        `Listing functions failed: HTTP ${res.status} ${await res.text()}`,
      );
    }
    const body = await res.json();
    functions.push(...(body.functions || []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return functions;
};

/** Returns a list of problems (empty if the functions match) */
const checkFunctions = (
  functions,
  { release, since, runtime, ignoreFunction },
) => {
  const problems = [];
  const sinceMs = since ? Date.parse(since) : undefined;
  const seenIgnored = new Set();
  let checked = 0;
  console.log(`\nCloud Functions (expecting release ${release}):`);
  for (const fn of functions) {
    const [, , , region, , name] = fn.name.split("/");
    const id = `${region}/${name}`;
    const deployedRelease = (fn.environmentVariables || {})
      .REACT_APP_SENTRY_RELEASE;
    const line = `${id}  ${fn.runtime}  ${fn.status}  updated ${fn.updateTime}  release ${deployedRelease}`;
    if ((fn.labels || {})["deployment-tool"] !== "cli-firebase") {
      console.log(`  skip (not deployed by the Firebase CLI)  ${line}`);
      continue;
    }
    if (ignoreFunction.includes(id)) {
      seenIgnored.add(id);
      console.log(`  skip (--ignore-function)                 ${line}`);
      continue;
    }
    checked++;
    const wrong = [];
    if (fn.status !== "ACTIVE") wrong.push(`status ${fn.status}`);
    if (deployedRelease !== release) wrong.push(`release ${deployedRelease}`);
    if (runtime && fn.runtime !== runtime) wrong.push(`runtime ${fn.runtime}`);
    if (sinceMs !== undefined && !(Date.parse(fn.updateTime) >= sinceMs)) {
      wrong.push(`updated before ${since}`);
    }
    console.log(`  ${wrong.length ? "FAIL" : "ok  "}  ${line}`);
    if (wrong.length) problems.push(`function ${id}: ${wrong.join(", ")}`);
  }
  for (const id of ignoreFunction) {
    if (!seenIgnored.has(id)) {
      console.log(`  note: --ignore-function ${id} does not exist (any more?)`);
    }
  }
  if (!checked) problems.push("no Cloud Functions to check");
  return problems;
};

const fetchText = async (url) => {
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
  return res.text();
};

/** Returns a problem string, or undefined if the site serves the expected release */
const checkClientSite = async (site, release) => {
  const html = await fetchText(`${site}/?verify-deployment=${Date.now()}`);
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(
    (m) => m[1],
  );
  if (!scripts.length) return `${site}: no <script src> in index.html`;
  const releases = new Set();
  for (const src of scripts) {
    const js = await fetchText(new URL(src, site).href);
    if (js.includes(`"${release}"`)) {
      console.log(`  ok    ${site}  ${src} contains "${release}"`);
      return undefined;
    }
    for (const m of js.matchAll(/"(\d{4}-\d{2}-\d{2}-[0-9a-f]{7,40})"/g))
      releases.add(m[1]);
  }
  return `${site}: serves ${scripts.join(", ")} with release ${
    [...releases].join(", ") || "unknown"
  }, not ${release}`;
};

const checkRedirect = async (from, to) => {
  const res = await fetch(`${from}/`, { redirect: "manual" });
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
    for (const site of CLIENT_SITES) {
      const problem = await checkClientSite(site, release);
      if (problem) {
        console.log(`  FAIL  ${problem}`);
        problems.push(problem);
      }
    }
    for (const [from, to] of Object.entries(REDIRECT_SITES)) {
      const problem = await checkRedirect(from, to);
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
  const token = await getAccessToken();
  const problems = [
    ...checkFunctions(await listFunctions(args.project, token), args),
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
};

if (require.main === module) {
  main().catch((err) => {
    console.error(`DEPLOYMENT VERIFICATION FAILED: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { parseArgs, checkFunctions, getAccessToken };
