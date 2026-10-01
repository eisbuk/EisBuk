/**
 * @vitest-environment jsdom
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/react";
import { FirestoreError } from "@firebase/firestore";

import i18n, { NotificationMessage } from "@eisbuk/translations";

vi.mock("@sentry/react", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
  flush: vi.fn(() => Promise.resolve(true)),
  Severity: { Warning: "warning" },
}));

/**
 * A fresh copy of the module (its in-memory state is reset, sessionStorage isn't):
 * the same as a page (re)load
 */
const loadModule = async () => {
  vi.resetModules();
  return import("../storageRecovery");
};

// #region errors
/** The errors the Firestore SDK (9.22.1) produces when the browser storage breaks */
const storageErrors = {
  "write that couldn't be persisted (Safari lost the IndexedDB server)":
    new FirestoreError(
      "unavailable",
      "Failed to persist write: IndexedDbTransactionError: [code=unavailable]: IndexedDB transaction 'Locally write mutations' failed: UnknownError: Connection to Indexed Database server lost. Refresh the page to try again"
    ),
  "failed internal queue": new Error(
    "FIRESTORE (9.22.1) INTERNAL ASSERTION FAILED: Unexpected state"
  ),
  "IndexedDB that can't be opened": new FirestoreError(
    "failed-precondition",
    "Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: InvalidStateError"
  ),
  "lost persistence lease": new FirestoreError(
    "failed-precondition",
    "Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs."
  ),
  "tab in a wrong state": new FirestoreError(
    "failed-precondition",
    "The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab."
  ),
};

const ordinaryErrors = {
  "permission denied": new FirestoreError(
    "permission-denied",
    "Missing or insufficient permissions."
  ),
  "document missing from the cache (healthy cache)": new FirestoreError(
    "unavailable",
    "Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"
  ),
  "cloud function error": Object.assign(new Error("unauthenticated"), {
    code: "functions/unauthenticated",
  }),
  "generic error": new Error("test"),
  "non-error value": "something went wrong",
  "no error": undefined,
};

const storageError = storageErrors["failed internal queue"];
// #endregion errors

// #region helpers
let visibilityState: DocumentVisibilityState = "visible";

const setVisibility = (state: DocumentVisibilityState) => {
  visibilityState = state;
  document.dispatchEvent(new Event("visibilitychange"));
};

const pageShow = (persisted: boolean) => {
  const e = new Event("pageshow") as PageTransitionEvent;
  Object.defineProperty(e, "persisted", { value: persisted });
  window.dispatchEvent(e);
};

const reload = vi.fn();

const addFormWithInput = () => {
  const form = document.createElement("form");
  const input = document.createElement("input");
  form.appendChild(input);
  document.body.appendChild(form);
  return { form, input };
};
// #endregion helpers

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01T19:00:00Z"));
  window.sessionStorage.clear();
  document.body.innerHTML = "";
  visibilityState = "visible";
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibilityState,
  });
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, reload },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("isStorageFailure", () => {
  test.each(Object.entries(storageErrors))(
    "recognises a %s",
    async (_, error) => {
      const { isStorageFailure } = await loadModule();
      expect(isStorageFailure(error)).toBe(true);
    }
  );

  test.each(Object.entries(ordinaryErrors))(
    "ignores a %s",
    async (_, error) => {
      const { isStorageFailure } = await loadModule();
      expect(isStorageFailure(error)).toBe(false);
    }
  );
});

describe("recoverFromStorageFailure", () => {
  test("shows a notice, reports to Sentry and reloads the page once, after a delay", async () => {
    const { recoverFromStorageFailure, RELOAD_DELAY_MS } = await loadModule();
    const notify = vi.fn();

    recoverFromStorageFailure({
      trigger: "write-failed",
      operation: "bookInterval",
      error: storageError,
      notify,
    });

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      i18n.t(NotificationMessage.StorageReloading)
    );
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Browser storage failure: reloading the page",
      expect.objectContaining({
        tags: {
          storageRecovery: "write-failed",
          operation: "bookInterval",
          errorCode: "Error",
          autoReload: "true",
        },
        extra: { errorMessage: storageError.message },
      })
    );

    await vi.advanceTimersByTimeAsync(RELOAD_DELAY_MS - 1);
    expect(reload).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(Sentry.flush).toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);

    // Further failures while the reload is pending do nothing
    recoverFromStorageFailure({ trigger: "write-failed", notify });
    await vi.runAllTimersAsync();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test("doesn't reload again within RELOAD_GUARD_MS (across page loads), asks the user to reload instead", async () => {
    let mod = await loadModule();
    const notify = vi.fn();

    mod.recoverFromStorageFailure({ trigger: "probe-failed", notify });
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(1);

    // The page reloaded, the storage broke again 5 minutes later
    vi.setSystemTime(Date.now() + 5 * 60 * 1000);
    mod = await loadModule();
    notify.mockClear();
    mod.recoverFromStorageFailure({ trigger: "probe-failed", notify });
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      i18n.t(NotificationMessage.StorageReloadNeeded)
    );
    expect(Sentry.captureMessage).toHaveBeenLastCalledWith(
      "Browser storage failure: asked the user to reload",
      expect.objectContaining({
        tags: expect.objectContaining({ autoReload: "false" }),
      })
    );

    // Once the window has passed, an automatic reload is allowed again
    vi.setSystemTime(Date.now() + mod.RELOAD_GUARD_MS);
    mod = await loadModule();
    mod.recoverFromStorageFailure({ trigger: "probe-failed", notify });
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(2);
  });

  test("never reloads automatically if sessionStorage doesn't work (no way to stop a loop)", async () => {
    const { recoverFromStorageFailure } = await loadModule();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const notify = vi.fn();

    recoverFromStorageFailure({ trigger: "probe-timeout", notify });
    await vi.runAllTimersAsync();

    expect(reload).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      i18n.t(NotificationMessage.StorageReloadNeeded)
    );
  });

  test("doesn't reload while a form with unsaved input is on the page", async () => {
    const { recoverFromStorageFailure, watchStorageHealth } =
      await loadModule();
    const stopWatching = watchStorageHealth({
      probe: () => Promise.resolve(),
      notify: vi.fn(),
    });
    const notify = vi.fn();
    const { form, input } = addFormWithInput();

    input.dispatchEvent(new Event("input", { bubbles: true }));

    recoverFromStorageFailure({ trigger: "probe-failed", notify });
    await vi.runAllTimersAsync();
    expect(reload).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      i18n.t(NotificationMessage.StorageReloadNeeded)
    );

    // Once the form is submitted, its input is no longer "unsaved"
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    recoverFromStorageFailure({ trigger: "write-failed", notify });
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(1);

    stopWatching();
  });

  test("a form that was removed from the page doesn't block the reload", async () => {
    const { recoverFromStorageFailure, watchStorageHealth } =
      await loadModule();
    const stopWatching = watchStorageHealth({
      probe: () => Promise.resolve(),
      notify: vi.fn(),
    });
    const { form, input } = addFormWithInput();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    form.remove();

    recoverFromStorageFailure({ trigger: "probe-failed", notify: vi.fn() });
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(1);

    stopWatching();
  });
});

describe("handleWriteError", () => {
  test("reports an ordinary error to Sentry with its code and lets the caller show its error", async () => {
    const { handleWriteError } = await loadModule();
    const error = ordinaryErrors["permission denied"];
    const notify = vi.fn();

    expect(handleWriteError(error, "bookInterval", notify)).toBe(false);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { operation: "bookInterval", errorCode: "permission-denied" },
    });
    expect(notify).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(reload).not.toHaveBeenCalled();
  });

  test("starts the recovery on a storage failure", async () => {
    const { handleWriteError } = await loadModule();
    const error =
      storageErrors[
        "write that couldn't be persisted (Safari lost the IndexedDB server)"
      ];
    const notify = vi.fn();

    expect(handleWriteError(error, "cancelBooking", notify)).toBe(true);

    expect(notify).toHaveBeenCalledWith(
      i18n.t(NotificationMessage.StorageReloading)
    );
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Browser storage failure: reloading the page",
      expect.objectContaining({
        tags: expect.objectContaining({
          operation: "cancelBooking",
          errorCode: "unavailable",
        }),
      })
    );
    await vi.runAllTimersAsync();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("runProbe", () => {
  test("a successful read is healthy", async () => {
    const { runProbe } = await loadModule();
    expect(await runProbe(() => Promise.resolve({}))).toEqual({
      result: "ok",
    });
  });

  test("an ordinary failure (e.g. document not in cache) is healthy", async () => {
    const { runProbe } = await loadModule();
    const probe = () =>
      Promise.reject(
        ordinaryErrors["document missing from the cache (healthy cache)"]
      );
    expect(await runProbe(probe)).toEqual({ result: "ok" });
  });

  test("a storage failure (also if thrown synchronously) is broken", async () => {
    const { runProbe } = await loadModule();
    const probe = () => {
      throw storageError;
    };
    expect(await runProbe(probe)).toEqual({
      result: "failed",
      error: storageError,
    });
  });

  test("a read that doesn't answer within the timeout is broken", async () => {
    const { runProbe, PROBE_TIMEOUT_MS } = await loadModule();
    const result = runProbe(() => new Promise(() => {}));
    await vi.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS);
    expect(await result).toEqual({ result: "timeout" });
  });
});

describe("watchStorageHealth", () => {
  const setup = async (probe: () => Promise<unknown>) => {
    const mod = await loadModule();
    const probeSpy = vi.fn(probe);
    const notify = vi.fn();
    const stopWatching = mod.watchStorageHealth({ probe: probeSpy, notify });
    return { ...mod, probeSpy, notify, stopWatching };
  };

  test("doesn't check the storage after a short absence", async () => {
    const { probeSpy, HIDDEN_THRESHOLD_MS, stopWatching } = await setup(() =>
      Promise.reject(storageError)
    );
    setVisibility("hidden");
    vi.setSystemTime(Date.now() + HIDDEN_THRESHOLD_MS - 1000);
    setVisibility("visible");
    await vi.runAllTimersAsync();

    expect(probeSpy).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    stopWatching();
  });

  test("checks the storage after a long absence and reloads if it's broken", async () => {
    const { probeSpy, notify, HIDDEN_THRESHOLD_MS, stopWatching } = await setup(
      () => Promise.reject(storageError)
    );
    setVisibility("hidden");
    vi.setSystemTime(Date.now() + HIDDEN_THRESHOLD_MS);
    setVisibility("visible");
    await vi.runAllTimersAsync();

    expect(probeSpy).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      i18n.t(NotificationMessage.StorageReloading)
    );
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Browser storage failure: reloading the page",
      expect.objectContaining({
        tags: expect.objectContaining({ storageRecovery: "probe-failed" }),
      })
    );
    expect(reload).toHaveBeenCalledTimes(1);
    stopWatching();
  });

  test("reloads if the check doesn't answer", async () => {
    const { HIDDEN_THRESHOLD_MS, stopWatching } = await setup(
      () => new Promise(() => {})
    );
    setVisibility("hidden");
    vi.setSystemTime(Date.now() + HIDDEN_THRESHOLD_MS);
    setVisibility("visible");
    await vi.runAllTimersAsync();

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Browser storage failure: reloading the page",
      expect.objectContaining({
        tags: expect.objectContaining({ storageRecovery: "probe-timeout" }),
      })
    );
    expect(reload).toHaveBeenCalledTimes(1);
    stopWatching();
  });

  test("does nothing if the storage is healthy", async () => {
    const { probeSpy, notify, HIDDEN_THRESHOLD_MS, stopWatching } = await setup(
      () => Promise.resolve({})
    );
    setVisibility("hidden");
    vi.setSystemTime(Date.now() + HIDDEN_THRESHOLD_MS * 10);
    setVisibility("visible");
    await vi.runAllTimersAsync();

    expect(probeSpy).toHaveBeenCalledTimes(1);
    expect(notify).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    stopWatching();
  });

  test("always checks a page restored from the back/forward cache", async () => {
    const { probeSpy, stopWatching } = await setup(() =>
      Promise.reject(storageError)
    );
    window.dispatchEvent(new Event("pagehide"));
    pageShow(true);
    // Chrome also fires 'visibilitychange' on restore: only one check
    setVisibility("visible");
    await vi.runAllTimersAsync();

    expect(probeSpy).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);

    // A normal page show (not from the cache) is not a return
    probeSpy.mockClear();
    pageShow(false);
    await vi.runAllTimersAsync();
    expect(probeSpy).not.toHaveBeenCalled();
    stopWatching();
  });

  test("stops listening on cleanup", async () => {
    const { probeSpy, HIDDEN_THRESHOLD_MS, stopWatching } = await setup(() =>
      Promise.resolve()
    );
    stopWatching();
    setVisibility("hidden");
    vi.setSystemTime(Date.now() + HIDDEN_THRESHOLD_MS);
    setVisibility("visible");
    await vi.runAllTimersAsync();
    expect(probeSpy).not.toHaveBeenCalled();
  });
});
