// Tests for verify-deployment.js. Run with: node --test common/scripts/
// Everything runs against local fakes: no request leaves this machine.
// VERIFY_DEPLOYMENT_SCRIPT runs the same tests against another copy of the script.

const assert = require("assert");
const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const nodeTest = require("node:test");

// A regression must fail, not hang the deploy workflow
const test = (name, fn) => nodeTest(name, { timeout: 30000 }, fn);

const SCRIPT =
  process.env.VERIFY_DEPLOYMENT_SCRIPT ||
  path.join(__dirname, "verify-deployment.js");
const verify = require(SCRIPT);

/** Starts a local HTTP server, returns its base URL and a close function */
const serve = async (handler) => {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  // If a test times out without closing its server, the run must still end
  server.unref();
  const sockets = new Set();
  server.on("connection", (s) => {
    s.unref();
    sockets.add(s);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => {
      sockets.forEach((s) => s.destroy());
      server.close();
    },
  };
};

/**
 * A handler whose responses send headers, then a byte every 100 ms, and never
 * end. `stats` records what was actually sent.
 */
const trickling = () => {
  const stats = { requests: 0, bodyBytes: 0 };
  const handler = (req, res) => {
    stats.requests++;
    res.writeHead(200, { "content-type": "application/json" });
    res.flushHeaders();
    const timer = setInterval(() => {
      res.write(" ");
      stats.bodyBytes++;
    }, 100);
    res.on("close", () => clearInterval(timer));
  };
  return { handler, stats };
};

/** Runs node asynchronously (the test's servers keep working meanwhile) */
const runNode = (args, env, timeoutMs = 20000) =>
  new Promise((resolve) => {
    const p = childProcess.spawn(process.execPath, args, {
      env: { PATH: process.env.PATH, ...env },
    });
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => p.kill("SIGKILL"), timeoutMs);
    p.on("close", (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stderr });
    });
  });

const fn = (id, overrides = {}) => {
  const [region, name] = id.split("/");
  return {
    name: `projects/p/locations/${region}/functions/${name}`,
    status: "ACTIVE",
    runtime: "nodejs22",
    updateTime: "2026-10-02T10:05:00Z",
    labels: { "deployment-tool": "cli-firebase" },
    environmentVariables: { REACT_APP_SENTRY_RELEASE: "r1" },
    ...overrides,
  };
};

/**
 * Writes a fake functions bundle. `exportsCode` can use cf(region...) to make a
 * callable carrying `__endpoint`, as firebase-functions does.
 */
const writeFakeBundle = (exportsCode, before = "") => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "verify-deployment-"));
  const file = path.join(dir, "index.js");
  fs.writeFileSync(
    file,
    `${before}
const cf = (...region) =>
  Object.assign(() => {}, { __endpoint: region.length ? { region } : {} });
module.exports = ${exportsCode};`,
  );
  return file;
};

/** Bundle code that never finishes loading (blocks without using the CPU) */
const BLOCK_FOREVER =
  "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);";

/** True if some process still has the bundle on its command line */
const bundleProcessLeft = (bundle) =>
  childProcess.spawnSync("pgrep", ["-f", bundle]).status === 0;

/** Calls loadExpectedFunctions in a child, so VERIFY_* settings apply */
const loadInChild = (bundle, env) =>
  runNode(
    [
      "-e",
      `require(${JSON.stringify(
        SCRIPT,
      )}).loadExpectedFunctions(${JSON.stringify(
        bundle,
      )}).then((r) => { console.error(JSON.stringify(r)); process.exit(0); },
        (e) => { console.error(e.message); process.exit(3); })`,
    ],
    env,
  );

test("a function missing from production fails the check", () => {
  const expected = ["europe-west6/a", "europe-west6/b", "europe-west6/c"];
  const live = [fn("europe-west6/a"), fn("europe-west6/c")];
  const problems = verify.checkFunctions(live, expected, { release: "r1" });
  assert.deepStrictEqual(problems, [
    "function europe-west6/b: missing in production",
  ]);
});

test("stale, inactive or wrong-runtime functions fail; extra ones are only listed", () => {
  const expected = ["europe-west6/a", "europe-west6/b", "europe-west6/c"];
  const live = [
    fn("europe-west6/a"),
    fn("europe-west6/b", { status: "DEPLOY_IN_PROGRESS" }),
    fn("europe-west6/c", {
      runtime: "nodejs18",
      environmentVariables: { REACT_APP_SENTRY_RELEASE: "r0" },
    }),
    fn("europe-west6/orphan", { runtime: "nodejs18" }),
  ];
  const problems = verify.checkFunctions(live, expected, {
    release: "r1",
    runtime: "nodejs22",
  });
  assert.deepStrictEqual(problems, [
    "function europe-west6/b: status DEPLOY_IN_PROGRESS",
    "function europe-west6/c: release r0, runtime nodejs18",
  ]);
});

test("all expected functions up to date pass", () => {
  const expected = ["europe-west6/a", "europe-west3/a"];
  const live = [fn("europe-west6/a"), fn("europe-west3/a")];
  assert.deepStrictEqual(
    verify.checkFunctions(live, expected, {
      release: "r1",
      runtime: "nodejs22",
      since: "2026-10-02T10:00:00Z",
    }),
    [],
  );
});

test("the expected functions come from the bundle exports", async () => {
  const bundle = writeFakeBundle(`{
    a: cf("europe-west6"),
    b: cf("europe-west6", "europe-west3"),
    c: cf(),
    helper: () => 1,
    notAFunction: undefined,
    // an object carrying __endpoint is not a function: not deployed
    plainObject: { __endpoint: { region: ["europe-west6"] } },
  }`);
  assert.deepStrictEqual(await verify.loadExpectedFunctions(bundle), [
    "europe-west6/a",
    "europe-west6/b",
    "europe-west3/b",
    "us-central1/c",
  ]);
  await assert.rejects(
    verify.loadExpectedFunctions(writeFakeBundle("{}")),
    /exports no functions/,
  );
  await assert.rejects(
    verify.loadExpectedFunctions("/nonexistent/index.js"),
    /build the functions first/,
  );
});

test("nested exports are named like firebase-functions names them", async () => {
  const bundle = writeFakeBundle(`{
    top: cf("europe-west6"),
    bookings: {
      create: cf("europe-west6"),
      admin: { list: cf("europe-west6", "europe-west3") },
    },
  }`);
  assert.deepStrictEqual(await verify.loadExpectedFunctions(bundle), [
    "europe-west6/top",
    "europe-west6/bookings-create",
    "europe-west6/bookings-admin-list",
    "europe-west3/bookings-admin-list",
  ]);
  // ...and a nested function missing in production is reported
  assert.deepStrictEqual(
    verify.checkFunctions(
      [fn("europe-west6/top"), fn("europe-west6/bookings-create")],
      [
        "europe-west6/top",
        "europe-west6/bookings-create",
        "europe-west6/bookings-admin-list",
      ],
      { release: "r1" },
    ),
    ["function europe-west6/bookings-admin-list: missing in production"],
  );
});

for (const [what, before] of [
  ["ignores SIGTERM", `process.on("SIGTERM", () => {}); ${BLOCK_FOREVER}`],
  ["stops itself", `process.kill(process.pid, "SIGSTOP");`],
]) {
  test(`a functions bundle that ${what} is killed at the bundle deadline`, async () => {
    const bundle = writeFakeBundle(`{ a: cf("europe-west6") }`, before);
    const start = Date.now();
    const child = await loadInChild(bundle, {
      VERIFY_BUNDLE_TIMEOUT_MS: "1000",
    });
    assert.strictEqual(child.status, 3, child.stderr);
    assert.match(child.stderr, /took more than 1000 ms/);
    assert.ok(Date.now() - start < 10000, "took too long");
    assert.ok(!bundleProcessLeft(bundle), "the bundle process survived");
  });
}

for (const [signal, expectedStatus] of [
  ["SIGTERM", 143],
  ["SIGINT", 130],
]) {
  test(`${signal} to the verifier kills a stopped bundle process and fails`, async () => {
    const bundle = writeFakeBundle(
      `{ a: cf("europe-west6") }`,
      `process.kill(process.pid, "SIGSTOP");`,
    );
    const verifier = childProcess.spawn(
      process.execPath,
      [SCRIPT, "--release", "r1", "--functions-bundle", bundle],
      {
        env: {
          PATH: process.env.PATH,
          ACCESS_TOKEN: "fake",
          VERIFY_FUNCTIONS_API: "http://127.0.0.1:1",
          VERIFY_BUNDLE_TIMEOUT_MS: "60000",
          VERIFY_DEADLINE_MS: "60000",
        },
      },
    );
    let stderr = "";
    verifier.stderr.on("data", (d) => (stderr += d));
    const closed = new Promise((resolve) =>
      verifier.on("close", (status) => resolve(status)),
    );
    // Wait for the bundle process to exist (it stops itself right away)
    for (let i = 0; i < 50 && !bundleProcessLeft(bundle); i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(bundleProcessLeft(bundle), "the bundle process never started");
    verifier.kill(signal);
    const status = await closed;
    assert.strictEqual(status, expectedStatus, stderr);
    assert.match(stderr, new RegExp(`interrupted by ${signal}`));
    assert.ok(!bundleProcessLeft(bundle), "the bundle process survived");
  });
}

test("a functions bundle that never loads cannot delay the overall deadline", async () => {
  const bundle = writeFakeBundle(
    `{ a: cf("europe-west6") }`,
    `process.on("SIGTERM", () => {}); ${BLOCK_FOREVER}`,
  );
  const start = Date.now();
  const child = await runNode(
    [SCRIPT, "--release", "r1", "--functions-bundle", bundle],
    {
      ACCESS_TOKEN: "fake",
      VERIFY_FUNCTIONS_API: "http://127.0.0.1:1",
      VERIFY_BUNDLE_TIMEOUT_MS: "60000",
      VERIFY_DEADLINE_MS: "1500",
    },
  );
  assert.strictEqual(child.status, 1, child.stderr);
  assert.match(child.stderr, /not finished within 1500 ms/);
  assert.ok(Date.now() - start < 10000, "took too long");
  assert.ok(!bundleProcessLeft(bundle), "the bundle process survived");
});

test("a functions list with unreachable regions is rejected", async () => {
  const api = await serve((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        functions: [fn("europe-west6/a")],
        unreachable: ["europe-west3"],
      }),
    );
  });
  try {
    await assert.rejects(
      verify.listFunctions("p", "token", api.url),
      /unreachable: europe-west3/,
    );
  } finally {
    api.close();
  }
});

test("the functions list follows pagination", async () => {
  const api = await serve((req, res) => {
    const page = new URL(req.url, "http://x").searchParams.get("pageToken");
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify(
        page
          ? { functions: [fn("europe-west6/b")] }
          : { functions: [fn("europe-west6/a")], nextPageToken: "next" },
      ),
    );
  });
  try {
    const functions = await verify.listFunctions("p", "token", api.url);
    assert.deepStrictEqual(
      functions.map((f) => f.name.split("/").pop()),
      ["a", "b"],
    );
  } finally {
    api.close();
  }
});

test("a response body that never ends hits the request deadline", async () => {
  const { handler, stats } = trickling();
  const slow = await serve(handler);
  try {
    const start = Date.now();
    await assert.rejects(
      verify.fetchWithDeadline(slow.url, {}, 500),
      /no complete response within 500 ms/,
    );
    assert.ok(stats.bodyBytes > 0, "the deadline hit before the body started");
    assert.ok(Date.now() - start < 3000, "took too long");
  } finally {
    slow.close();
  }
});

test("a hosting site whose bundle never finishes downloading is reported, not waited for", async () => {
  const { handler, stats } = trickling();
  const site = await serve((req, res) => {
    if (req.url.startsWith("/assets/")) return handler(req, res);
    res.writeHead(200, { "content-type": "text/html" });
    res.end('<script type="module" src="/assets/index-1.js"></script>');
  });
  try {
    await assert.rejects(
      verify.checkClientSite(site.url, "r1", 500),
      /no complete response/,
    );
    assert.ok(stats.bodyBytes > 0, "the deadline hit before the body started");
  } finally {
    site.close();
  }
});

test("a token endpoint that never finishes its body hits the request deadline", async () => {
  const { handler, stats } = trickling();
  const slow = await serve(handler);
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const keyFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "verify-deployment-")),
    "key.json",
  );
  fs.writeFileSync(
    keyFile,
    JSON.stringify({
      client_email: "fake@example.invalid",
      private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
      token_uri: `${slow.url}/token`,
    }),
  );
  // getAccessToken uses the module's REQUEST_TIMEOUT_MS: run it in a child,
  // asynchronously so that this process keeps serving the trickling body
  const child = await runNode(
    [
      "-e",
      `require(${JSON.stringify(SCRIPT)}).getAccessToken()
        .then(() => process.exit(0), (e) => { console.error(e.message); process.exit(3); })`,
    ],
    {
      GOOGLE_APPLICATION_CREDENTIALS: keyFile,
      VERIFY_REQUEST_TIMEOUT_MS: "2000",
    },
  );
  slow.close();
  assert.strictEqual(stats.requests, 1);
  assert.ok(
    stats.bodyBytes >= 3,
    `headers and body bytes should have been sent (${stats.bodyBytes})`,
  );
  assert.strictEqual(child.status, 3, child.stderr);
  assert.match(child.stderr, /no complete response within 2000 ms/);
});

test("the whole verification fails at the overall deadline", async () => {
  const { handler, stats } = trickling();
  const slow = await serve(handler);
  const bundle = writeFakeBundle(`{ a: cf("europe-west6") }`);
  const start = Date.now();
  const child = await runNode(
    [SCRIPT, "--release", "r1", "--functions-bundle", bundle],
    {
      ACCESS_TOKEN: "fake",
      VERIFY_FUNCTIONS_API: slow.url,
      VERIFY_REQUEST_TIMEOUT_MS: "60000",
      VERIFY_DEADLINE_MS: "3000",
    },
  );
  slow.close();
  assert.ok(stats.bodyBytes > 0, "the functions list should have started");
  assert.strictEqual(child.status, 1);
  assert.match(child.stderr, /not finished within 3000 ms/);
  assert.ok(Date.now() - start < 15000, "took too long");
});
