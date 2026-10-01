/**
 * Recovery from a broken browser storage.
 *
 * Mobile Safari can drop the IndexedDB connection of a tab that sat in the background.
 * From then on the Firestore SDK (with IndexedDB persistence) rejects every write locally,
 * or its internal queue fails for good ("INTERNAL ASSERTION FAILED"): nothing works until
 * the page is reloaded. Here we detect that state (on return to the page and on failed
 * writes) and reload the page, at most once in `RELOAD_GUARD_MS`.
 */
import * as Sentry from "@sentry/react";

import i18n, { NotificationMessage } from "@eisbuk/translations";

/**
 * The page must have been hidden at least this long before we check the storage on return.
 * Short app switches (reading an SMS, a quick look at the calendar) don't need a check;
 * longer ones are when iOS suspends the tab and may drop its storage connection.
 */
export const HIDDEN_THRESHOLD_MS = 30 * 1000;
/**
 * A check of a healthy storage takes milliseconds. One that takes longer than this
 * is stuck (Safari can leave IndexedDB requests pending forever).
 */
export const PROBE_TIMEOUT_MS = 10 * 1000;
/** At most one automatic reload per tab in this time window. */
export const RELOAD_GUARD_MS = 10 * 60 * 1000;
/** Time for the user to read the notice before the page reloads. */
export const RELOAD_DELAY_MS = 3 * 1000;

const RELOAD_GUARD_KEY = "eisbuk:storageRecoveryReloadAt";

/**
 * Messages of errors caused by a broken local storage (Firestore SDK 9.22.1 and Safari wording).
 * Ordinary failures (e.g. "Missing or insufficient permissions.", validation errors) don't match.
 */
const STORAGE_FAILURE_PATTERNS = [
  // Firestore internal failure, e.g. "AsyncQueue is already failed" / "Unexpected state"
  // after an IndexedDB error: every following operation fails until reload
  /INTERNAL ASSERTION FAILED/,
  // Firestore's wrapped IndexedDB errors: "IndexedDB transaction '...' failed: ...",
  // "Unable to open an IndexedDB connection ..."
  /IndexedDB/i,
  // Safari: "Connection to Indexed Database server lost. Refresh the page to try again"
  /Indexed Database/i,
  // Firestore lost its persistence lease: "Failed to obtain exclusive access to the persistence layer ..."
  /persistence layer/i,
  // "The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab."
  /not in the required state/i,
];

/**
 * Tells whether an error means the browser storage used by Firestore is broken
 * (and a page reload is needed).
 */
export const isStorageFailure = (error: unknown): boolean => {
  const message = getErrorMessage(error);
  return STORAGE_FAILURE_PATTERNS.some((pattern) => pattern.test(message));
};

const getErrorMessage = (error: unknown): string =>
  typeof (error as Error | undefined)?.message === "string"
    ? (error as Error).message
    : "";

const getErrorCode = (error: unknown): string => {
  const { code, name } = (error || {}) as { code?: unknown; name?: unknown };
  return String(code || name || "unknown");
};

// #region reloadGuard
/** In memory: a reload is already scheduled in this page, don't schedule another one */
let reloadScheduled = false;

/**
 * Returns `true` (and records the reload) if an automatic reload is allowed now:
 * at most one in `RELOAD_GUARD_MS`, remembered across reloads in sessionStorage.
 * Without a working sessionStorage we couldn't stop a reload loop, so we never reload automatically.
 */
export const claimAutomaticReload = (now = Date.now()): boolean => {
  if (reloadScheduled) return false;
  try {
    const storage = window.sessionStorage;
    const lastReload = Number(storage.getItem(RELOAD_GUARD_KEY));
    if (lastReload && Math.abs(now - lastReload) < RELOAD_GUARD_MS) {
      return false;
    }
    storage.setItem(RELOAD_GUARD_KEY, String(now));
    return storage.getItem(RELOAD_GUARD_KEY) === String(now);
  } catch {
    return false;
  }
};
// #endregion reloadGuard

// #region unsavedForms
/**
 * Forms the user typed in, from the first input until they're submitted or removed from the page.
 * We don't reload automatically while one exists: that would throw away what the user typed.
 */
const editedForms = new Set<HTMLFormElement>();

const handleInput = (e: Event) => {
  const form = (e.target as HTMLInputElement | null)?.form;
  if (form) editedForms.add(form);
};
const handleSubmit = (e: Event) => {
  editedForms.delete(e.target as HTMLFormElement);
};

export const hasUnsavedForm = (): boolean => {
  for (const form of editedForms) {
    if (form.isConnected) return true;
    editedForms.delete(form);
  }
  return false;
};
// #endregion unsavedForms

type Notify = (message: string) => void;

interface RecoveryParams {
  trigger: "probe-failed" | "probe-timeout" | "write-failed";
  /** The failed operation (for write failures) */
  operation?: string;
  error?: unknown;
  /** Shows a notice to the user */
  notify: Notify;
}

const reloadPage = () => window.location.reload();

/**
 * Reports the broken storage to Sentry and reloads the page after a short notice.
 * If an automatic reload isn't allowed (a form has unsaved input, or we already reloaded
 * recently), it only shows a notice asking the user to reload.
 */
export const recoverFromStorageFailure = ({
  trigger,
  operation,
  error,
  notify,
}: RecoveryParams): void => {
  if (reloadScheduled) return;

  const autoReload = !hasUnsavedForm() && claimAutomaticReload();

  Sentry.captureMessage(
    autoReload
      ? "Browser storage failure: reloading the page"
      : "Browser storage failure: asked the user to reload",
    {
      level: Sentry.Severity.Warning,
      tags: {
        storageRecovery: trigger,
        operation: operation || "none",
        errorCode: error ? getErrorCode(error) : "none",
        autoReload: String(autoReload),
      },
      extra: { errorMessage: getErrorMessage(error).slice(0, 500) },
    }
  );

  if (!autoReload) {
    notify(i18n.t(NotificationMessage.StorageReloadNeeded));
    return;
  }

  reloadScheduled = true;
  notify(i18n.t(NotificationMessage.StorageReloading));
  setTimeout(async () => {
    try {
      // Give the Sentry report a chance to leave before the page goes away
      await Sentry.flush(2000);
    } finally {
      reloadPage();
    }
  }, RELOAD_DELAY_MS);
};

/**
 * Handles a failed Firestore write: a storage failure starts the recovery (and returns `true`,
 * the caller should not show its own error), any other error is reported to Sentry
 * (and returns `false`, the caller shows its usual error).
 */
export const handleWriteError = (
  error: unknown,
  operation: string,
  notify: Notify
): boolean => {
  if (isStorageFailure(error)) {
    recoverFromStorageFailure({
      trigger: "write-failed",
      operation,
      error,
      notify,
    });
    return true;
  }
  Sentry.captureException(error, {
    tags: { operation, errorCode: getErrorCode(error) },
  });
  return false;
};

/**
 * Runs the storage check, bounded by `timeoutMs`.
 * Only a storage failure (or no answer) counts as broken: e.g. a document missing
 * from the cache is a perfectly healthy answer.
 */
export const runProbe = async (
  probe: () => Promise<unknown>,
  timeoutMs = PROBE_TIMEOUT_MS
): Promise<{ result: "ok" | "failed" | "timeout"; error?: unknown }> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), timeoutMs);
  });
  try {
    const result = await Promise.race([
      // `then` turns a synchronous throw of the probe into a rejection
      Promise.resolve()
        .then(probe)
        .then(() => "ok" as const),
      timeout,
    ]);
    return { result };
  } catch (error) {
    return isStorageFailure(error)
      ? { result: "failed", error }
      : { result: "ok" };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Checks the storage each time the user comes back to the page (after it was hidden for at least
 * `HIDDEN_THRESHOLD_MS`, or restored from the back/forward cache) and recovers if it's broken.
 * Returns a cleanup function.
 */
export const watchStorageHealth = ({
  probe,
  notify,
}: {
  probe: () => Promise<unknown>;
  notify: Notify;
}): (() => void) => {
  let hiddenAt: number | null =
    document.visibilityState === "hidden" ? Date.now() : null;
  let checking = false;

  const handleHidden = () => {
    if (hiddenAt === null) hiddenAt = Date.now();
  };

  /**
   * @param force check even after a short absence: Firestore shuts its persistence
   * down on `pagehide`, so a page restored from the back/forward cache always needs a check
   */
  const handleReturn = async (force: boolean) => {
    const hiddenFor = hiddenAt === null ? 0 : Date.now() - hiddenAt;
    hiddenAt = null;
    if (checking || (!force && hiddenFor < HIDDEN_THRESHOLD_MS)) return;

    checking = true;
    const { result, error } = await runProbe(probe);
    checking = false;

    if (result !== "ok") {
      recoverFromStorageFailure({ trigger: `probe-${result}`, error, notify });
    }
  };

  const handleVisibilityChange = () =>
    document.visibilityState === "hidden"
      ? handleHidden()
      : handleReturn(false);
  const handlePageShow = (e: PageTransitionEvent) => {
    if (e.persisted) handleReturn(true);
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handleHidden);
  window.addEventListener("pageshow", handlePageShow);
  document.addEventListener("input", handleInput, true);
  document.addEventListener("submit", handleSubmit, true);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", handleHidden);
    window.removeEventListener("pageshow", handlePageShow);
    document.removeEventListener("input", handleInput, true);
    document.removeEventListener("submit", handleSubmit, true);
  };
};
