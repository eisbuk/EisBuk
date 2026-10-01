// Tests for verify-deployment.js. Run with: node --test common/scripts/
// Everything runs against local fakes: no request leaves this machine.

const assert = require("assert");
const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { test } = require("node:test");

const verify = require("./verify-deployment");

const SCRIPT = path.join(__dirname, "verify-deployment.js");

/** Starts a local HTTP server, returns its base URL and a close function */
const serve = async (handler) => {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const sockets = new Set();
  server.on("connection", (s) => sockets.add(s));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => {
      sockets.forEach((s) => s.destroy());
      server.close();
    },
  };
};

/** A response that sends a byte every 100 ms and never ends */
const trickle = (req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  const timer = setInterval(() => res.write(" "), 100);
  res.on("close", () => clearInterval(timer));
};

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

const writeFakeBundle = (exports) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "verify-deployment-"));
  const file = path.join(dir, "index.js");
  fs.writeFileSync(file, `module.exports = ${exports};`);
  return file;
};

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

test("the expected functions come from the bundle exports", () => {
  const bundle = writeFakeBundle(`{
    a: { __endpoint: { region: ["europe-west6"] } },
    b: { __endpoint: { region: ["europe-west6", "europe-west3"] } },
    c: { __endpoint: {} },
    helper: () => 1,
    notAFunction: undefined,
  }`);
  assert.deepStrictEqual(verify.loadExpectedFunctions(bundle), [
    "europe-west6/a",
    "europe-west6/b",
    "europe-west3/b",
    "us-central1/c",
  ]);
  assert.throws(
    () => verify.loadExpectedFunctions(writeFakeBundle("{}")),
    /exports no functions/,
  );
  assert.throws(
    () => verify.loadExpectedFunctions("/nonexistent/index.js"),
    /build the functions first/,
  );
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
  const slow = await serve(trickle);
  try {
    const start = Date.now();
    await assert.rejects(
      verify.fetchWithDeadline(slow.url, {}, 500),
      /no complete response within 500 ms/,
    );
    assert.ok(Date.now() - start < 3000, "took too long");
  } finally {
    slow.close();
  }
});

test("a hosting site whose bundle never finishes downloading is reported, not waited for", async () => {
  const site = await serve((req, res) => {
    if (req.url.startsWith("/assets/")) return trickle(req, res);
    res.writeHead(200, { "content-type": "text/html" });
    res.end('<script type="module" src="/assets/index-1.js"></script>');
  });
  try {
    await assert.rejects(
      verify.checkClientSite(site.url, "r1"),
      /no complete response/,
    );
  } finally {
    site.close();
  }
});

test("a token endpoint that never finishes hits the request deadline", async () => {
  const slow = await serve(trickle);
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
  // getAccessToken uses the module's REQUEST_TIMEOUT_MS: run it in a child
  const child = childProcess.spawnSync(
    process.execPath,
    [
      "-e",
      `require(${JSON.stringify(SCRIPT)}).getAccessToken()
        .then(() => process.exit(0), (e) => { console.error(e.message); process.exit(3); })`,
    ],
    {
      encoding: "utf8",
      timeout: 20000,
      env: {
        PATH: process.env.PATH,
        GOOGLE_APPLICATION_CREDENTIALS: keyFile,
        VERIFY_REQUEST_TIMEOUT_MS: "500",
      },
    },
  );
  slow.close();
  assert.strictEqual(child.status, 3, child.stderr);
  assert.match(child.stderr, /no complete response within 500 ms/);
});

test("the whole verification fails at the overall deadline", async () => {
  const slow = await serve(trickle);
  const bundle = writeFakeBundle(
    `{ a: { __endpoint: { region: ["europe-west6"] } } }`,
  );
  const start = Date.now();
  const child = await new Promise((resolve) => {
    const p = childProcess.spawn(
      process.execPath,
      [SCRIPT, "--release", "r1", "--functions-bundle", bundle],
      {
        env: {
          PATH: process.env.PATH,
          ACCESS_TOKEN: "fake",
          VERIFY_FUNCTIONS_API: slow.url,
          VERIFY_REQUEST_TIMEOUT_MS: "60000",
          VERIFY_DEADLINE_MS: "1500",
        },
      },
    );
    let stderr = "";
    p.stderr.on("data", (d) => (stderr += d));
    p.on("exit", (status) => resolve({ status, stderr }));
  });
  slow.close();
  assert.strictEqual(child.status, 1);
  assert.match(child.stderr, /not finished within 1500 ms/);
  assert.ok(Date.now() - start < 10000, "took too long");
});
