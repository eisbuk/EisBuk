/**
 * Regression tests for #944: whatever state the Sentry server is in, a wrapped
 * cloud function must complete its own work and settle with its own result
 * (or its own error), within a small bounded delay.
 *
 * The Sentry wrapper is disabled in the emulators (`FUNCTIONS_EMULATOR`), so
 * these tests import the functions' wrapper directly, enable it with a DSN
 * pointing to a local fake Sentry server, and call the wrapped handlers in
 * this process. No emulator is needed.
 */
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import http from "http";
import net, { AddressInfo } from "net";
import path from "path";
import { createRequire } from "module";

// Upper bound for the time a wrapped function may spend on reporting
// (the flush is bounded to 1 s, plus a margin)
const maxReportingDelay = 1500;

type WrapperModule =
  typeof import("../../../functions/src/sentry-serverless-firebase.js");

// #region fakeSentry
interface FakeSentry {
  dsn: string;
  /** Raw envelopes received by the server (only for servers that answer) */
  received: string[];
  close: () => Promise<void>;
}

const listen = async (server: net.Server): Promise<number> => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return (server.address() as AddressInfo).port;
};

const trackSockets = (server: net.Server) => {
  const sockets = new Set<net.Socket>();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  return () =>
    new Promise<void>((resolve) => {
      sockets.forEach((socket) => socket.destroy());
      server.close(() => resolve());
    });
};

const dsnForPort = (port: number) => `http://public@127.0.0.1:${port}/1`;

/** An HTTP server answering every request with the given status */
const answeringSentry = async (status: number): Promise<FakeSentry> => {
  const received: string[] = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      received.push(body);
      res.writeHead(status);
      res.end();
    });
  });
  const close = trackSockets(server);
  const port = await listen(server);
  return { dsn: dsnForPort(port), received, close };
};

/** A server accepting connections and never answering */
const hangingSentry = async (): Promise<FakeSentry> => {
  const server = net.createServer(() => {});
  const close = trackSockets(server);
  const port = await listen(server);
  return { dsn: dsnForPort(port), received: [], close };
};

/** A port nobody listens on: connections are refused */
const refusingSentry = async (): Promise<FakeSentry> => {
  const server = net.createServer();
  const port = await listen(server);
  await new Promise((resolve) => server.close(resolve));
  return { dsn: dsnForPort(port), received: [], close: async () => {} };
};

/** A host name that never resolves (RFC 6761 reserves `.invalid`) */
const unresolvableSentry = async (): Promise<FakeSentry> => ({
  dsn: "http://public@sentry.invalid/1",
  received: [],
  close: async () => {},
});

/** A DSN the SDK can't parse */
const invalidDsnSentry = async (): Promise<FakeSentry> => ({
  dsn: "not-a-dsn",
  received: [],
  close: async () => {},
});
// #endregion fakeSentry

// #region helpers
const envBackup = { ...process.env };

/**
 * Loads a fresh copy of the wrapper (and of the functions' constants, which
 * initialise Sentry), with Sentry enabled and pointed to the given DSN.
 */
const loadWrapper = async (dsn: string | undefined): Promise<WrapperModule> => {
  delete process.env.FUNCTIONS_EMULATOR;
  if (dsn === undefined) {
    delete process.env.FUNCTIONS_SENTRY_DSN;
  } else {
    process.env.FUNCTIONS_SENTRY_DSN = dsn;
  }
  vi.resetModules();
  return import("../../../functions/src/sentry-serverless-firebase.js");
};

/** A minimal stand-in for the express request of a callable function */
const fakeRawRequest = (body: unknown) => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    host: "europe-west6-test.cloudfunctions.net",
    "x-forwarded-for": ["198", "51", "100", "7"].join("."),
  };
  return {
    method: "POST",
    url: "/",
    originalUrl: "/",
    protocol: "https",
    headers,
    body,
    query: {},
    header: (name: string) => headers[name.toLowerCase()],
    connection: { remoteAddress: headers["x-forwarded-for"] },
    socket: { remoteAddress: headers["x-forwarded-for"] },
  };
};

const callableContext = (payload: unknown) =>
  ({ rawRequest: fakeRawRequest({ data: payload }) }) as any;

const triggerContext = { params: { organization: "test-org" } } as any;

/** Runs the promise and returns how it settled and how long it took */
const settle = async <T>(p: () => Promise<T>) => {
  const start = Date.now();
  try {
    const value = await p();
    return { value, error: undefined, ms: Date.now() - start };
  } catch (error) {
    return { value: undefined, error, ms: Date.now() - start };
  }
};
const deferred = () => {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((_resolve) => (resolve = _resolve));
  return { promise, resolve };
};

/** Error and transaction events from the envelopes received by a fake Sentry */
const parseEvents = (envelopes: string[]): any[] =>
  envelopes
    .flatMap((envelope) => envelope.split("\n"))
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((item) => item && (item.exception || item.type === "transaction"));
// #endregion helpers

const sentryStates: [string, () => Promise<FakeSentry>][] = [
  ["refuses connections", refusingSentry],
  ["accepts connections and never answers", hangingSentry],
  ["answers with HTTP 500", () => answeringSentry(500)],
  ["answers with HTTP 403", () => answeringSentry(403)],
  ["host name doesn't resolve", unresolvableSentry],
  ["DSN is invalid", invalidDsnSentry],
];

describe("Sentry wrapper for cloud functions (#944)", () => {
  afterAll(() => {
    process.env = envBackup;
  });

  describe.each(sentryStates)("when the Sentry server %s", (_, makeSentry) => {
    let sentry: FakeSentry;
    let wrapper: WrapperModule;

    beforeAll(async () => {
      sentry = await makeSentry();
      wrapper = await loadWrapper(sentry.dsn);
    });

    afterAll(async () => {
      await sentry.close();
    });

    test("a callable returns its own result, without significant delay", async () => {
      const handler = wrapper.wrapHttpsOnCallHandler(
        "testCallable",
        async (payload: { n: number }) => ({ doubled: payload.n * 2 }),
      );
      const res = await settle(() =>
        handler({ n: 21 }, callableContext({ n: 21 })),
      );
      expect(res.error).toBeUndefined();
      expect(res.value).toEqual({ doubled: 42 });
      expect(res.ms).toBeLessThan(maxReportingDelay);
    });

    test("a callable failing with its own error rejects with that same error", async () => {
      // Stands in for an 'HttpsError', which the client receives as is
      const original = Object.assign(new Error("not allowed"), {
        code: "unauthenticated",
      });
      const handler = wrapper.wrapHttpsOnCallHandler(
        "testCallable",
        async () => {
          throw original;
        },
      );
      const res = await settle(() => handler({}, callableContext({})));
      expect(res.error).toBe(original);
      expect(res.ms).toBeLessThan(maxReportingDelay);
    });

    test("a callable throwing synchronously rejects with its own error", async () => {
      const original = new Error("sync failure");
      const handler = wrapper.wrapHttpsOnCallHandler("testCallable", () => {
        throw original;
      });
      const res = await settle(async () => handler({}, callableContext({})));
      expect(res.error).toBe(original);
      expect(res.ms).toBeLessThan(maxReportingDelay);
    });

    test("a Firestore trigger completes its work and resolves", async () => {
      let workDone = false;
      const handler = wrapper.wrapFirestoreOnWriteHandler(
        "testTrigger",
        async () => {
          workDone = true;
        },
      );
      const res = await settle(async () => handler({} as any, triggerContext));
      expect(workDone).toBe(true);
      expect(res.error).toBeUndefined();
      expect(res.ms).toBeLessThan(maxReportingDelay);
    });

    test("an HTTP function sends its response and resolves", async () => {
      const handler = wrapper.wrapHttpsOnRequestHandler(
        "testRequest",
        (req, res) => {
          res.send("ok");
        },
      );
      const sent: string[] = [];
      const res = await settle(async () =>
        handler(
          fakeRawRequest({}) as any,
          { send: (x: string) => sent.push(x) } as any,
        ),
      );
      expect(sent).toEqual(["ok"]);
      expect(res.error).toBeUndefined();
      expect(res.ms).toBeLessThan(maxReportingDelay);
    });
  });

  describe("when no DSN is configured", () => {
    test("functions are not wrapped at all", async () => {
      const wrapper = await loadWrapper(undefined);
      const fn = async () => "result";
      expect(wrapper.wrapHttpsOnCallHandler("testCallable", fn)).toBe(fn);
    });
  });

  describe("when the Sentry server accepts events", () => {
    let sentry: FakeSentry;
    let wrapper: WrapperModule;

    beforeAll(async () => {
      sentry = await answeringSentry(200);
      wrapper = await loadWrapper(sentry.dsn);
    });
    afterEach(() => {
      sentry.received.length = 0;
    });
    afterAll(async () => {
      await sentry.close();
    });

    test.each([
      ["A", "B"],
      ["B", "A"],
    ])(
      "overlapping invocations keep their own metadata (%s finishes first)",
      async (first, second) => {
        const runs = { A: deferred(), B: deferred() };
        const invoke = (id: "A" | "B") =>
          settle(() =>
            wrapper.wrapHttpsOnCallHandler(`testCallable${id}`, async () => {
              await runs[id].promise;
              throw new Error(`failure-${id}`);
            })(
              { organization: `org-${id}` },
              callableContext({ organization: `org-${id}` }),
            ),
          );

        // A starts, then B starts while A is still running
        const settled = { A: invoke("A"), B: invoke("B") };
        await new Promise((resolve) => setTimeout(resolve, 20));

        runs[first as "A" | "B"].resolve();
        await settled[first as "A" | "B"];
        runs[second as "A" | "B"].resolve();
        await settled[second as "A" | "B"];

        const events = parseEvents(sentry.received);
        (["A", "B"] as const).forEach((id) => {
          const other = id === "A" ? "B" : "A";

          const error = events.find(
            (e) => e.exception?.values?.[0]?.value === `failure-${id}`,
          );
          const transaction = events.find(
            (e) =>
              e.type === "transaction" && e.transaction === `testCallable${id}`,
          );
          expect(error).toBeDefined();
          expect(transaction).toBeDefined();

          expect(error.transaction).toEqual(`testCallable${id}`);
          expect(error.contexts.trace.trace_id).toEqual(
            transaction.contexts.trace.trace_id,
          );
          expect(JSON.stringify(error.request)).toContain(`org-${id}`);
          expect(JSON.stringify(error)).not.toContain(`org-${other}`);
          expect(JSON.stringify(transaction.request)).toContain(`org-${id}`);
          expect(JSON.stringify(transaction)).not.toContain(`org-${other}`);
        });
      },
    );

    test("errors are still reported", async () => {
      const handler = wrapper.wrapHttpsOnCallHandler("testCallable", () => {
        throw new Error("reported failure");
      });
      await settle(async () => handler({}, callableContext({})));
      expect(sentry.received.join("\n")).toContain("reported failure");
    });

    test("event processors don't pile up across invocations", async () => {
      // The functions' own copy of the SDK (the client depends on another version)
      const { getCurrentScope } = createRequire(
        path.join(__dirname, "../../../functions/package.json"),
      )("@sentry/node");
      const countProcessors = () =>
        (getCurrentScope() as any)._eventProcessors.length;

      const handler = wrapper.wrapHttpsOnCallHandler(
        "testCallable",
        async () => "ok",
      );
      await handler({}, callableContext({}));
      const before = countProcessors();
      await handler({}, callableContext({}));
      await handler({}, callableContext({}));
      await handler({}, callableContext({}));
      expect(countProcessors()).toEqual(before);
    });

    // Built at runtime, so that the source lines Sentry attaches to stack
    // frames don't contain the values we look for
    const pii = {
      name: ["Zz", "name"].join(""),
      surname: ["Zz", "surname"].join(""),
      email: ["zz.athlete", "example.com"].join("@"),
      secretKey: ["zz", "secret", "key"].join("-"),
      idToken: ["zz", "id", "token"].join("-"),
      ip: ["198", "51", "100", "7"].join("."),
    };

    const expectNoPII = (sent: string) => {
      Object.values(pii).forEach((value) => expect(sent).not.toContain(value));
    };

    test("athletes' personal data in callable requests doesn't reach Sentry", async () => {
      const customer = {
        name: pii.name,
        surname: pii.surname,
        email: pii.email,
        secretKey: pii.secretKey,
      };
      const context = callableContext({ customer });
      context.rawRequest.headers.authorization = `Bearer ${pii.idToken}`;
      const handler = wrapper.wrapHttpsOnCallHandler(
        "testCallable",
        async () => {
          throw new Error("failure with customer payload");
        },
      );
      await settle(() => handler({ customer }, context));
      const sent = sentry.received.join("\n");
      expect(sent).toContain("failure with customer payload");
      expectNoPII(sent);
    });

    test("secret keys in trigger paths don't reach Sentry", async () => {
      const handler = wrapper.wrapFirestoreOnWriteHandler(
        "testTrigger",
        async () => {
          throw new Error("trigger failure");
        },
      );
      const context = {
        eventType: "providers/cloud.firestore/eventTypes/document.write",
        params: { organization: "test-org", secretKey: pii.secretKey },
        resource: {
          service: "firestore.googleapis.com",
          name: `projects/test/databases/(default)/documents/organizations/test-org/bookings/${pii.secretKey}`,
        },
      } as any;
      await settle(async () => handler({} as any, context));
      const sent = sentry.received.join("\n");
      expect(sent).toContain("trigger failure");
      expectNoPII(sent);
    });
  });

  describe("when Sentry can't be initialised", () => {
    let wrapper: WrapperModule;
    let sentry: FakeSentry;

    beforeAll(async () => {
      sentry = await answeringSentry(200);
      // A malformed proxy makes the SDK's transport (created in 'init') throw
      process.env.http_proxy = "http://[";
      wrapper = await loadWrapper(sentry.dsn);
    });
    afterAll(async () => {
      delete process.env.http_proxy;
      await sentry.close();
    });

    test("a callable returns its own result", async () => {
      const handler = wrapper.wrapHttpsOnCallHandler(
        "testCallable",
        async () => "result",
      );
      expect(await handler({}, callableContext({}))).toEqual("result");
    });

    test("a callable failing rejects with its own error", async () => {
      const original = new Error("own failure");
      const handler = wrapper.wrapHttpsOnCallHandler(
        "testCallable",
        async () => {
          throw original;
        },
      );
      const res = await settle(() => handler({}, callableContext({})));
      expect(res.error).toBe(original);
    });
  });
});
