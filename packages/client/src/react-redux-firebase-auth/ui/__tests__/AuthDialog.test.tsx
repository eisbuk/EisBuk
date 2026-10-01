/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, vi, expect, test, afterEach } from "vitest";
import { screen, render, cleanup, waitFor } from "@testing-library/react";

import i18n, { AuthErrorMessage, AuthTitle } from "@eisbuk/translations";

import AuthDialog from "../AuthDialog";

const mockSignInWithPopup = vi.fn();
const mockSignInWithRedirect = vi.fn();
vi.mock("@firebase/auth", async () => {
  const auth = (await vi.importActual("@firebase/auth")) as object;
  return {
    ...auth,
    getAuth: () => ({}),
    GoogleAuthProvider: class {},
    isSignInWithEmailLink: () => false,
    signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
    signInWithRedirect: (...args: any[]) => mockSignInWithRedirect(...args),
  };
});

const authError = (code: string) =>
  Object.assign(new Error(code), { code, name: "FirebaseError" });

const clickSignInWithGoogle = () =>
  screen.getByLabelText(i18n.t(AuthTitle.SignInWithGoogle) as string).click();

/** A promise settled from the outside, standing in for a popup left open */
const deferred = () => {
  let resolve: (value: unknown) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve, reject };
};

/** Lets pending promise callbacks (and resulting state updates) run */
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("AuthDialog: sign in with Google (#960)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  test("opens the Google popup straight from the click, not a redirect", () => {
    mockSignInWithPopup.mockResolvedValueOnce({});
    render(<AuthDialog />);
    clickSignInWithGoogle();
    // Synchronously, within the click: otherwise browsers block the popup
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });

  test("falls back to a redirect if the popup is blocked", async () => {
    mockSignInWithPopup.mockRejectedValueOnce(authError("auth/popup-blocked"));
    render(<AuthDialog />);
    clickSignInWithGoogle();
    await waitFor(() =>
      expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1),
    );
  });

  test("falls back to a redirect where popups aren't supported", async () => {
    mockSignInWithPopup.mockRejectedValueOnce(
      authError("auth/operation-not-supported-in-this-environment"),
    );
    render(<AuthDialog />);
    clickSignInWithGoogle();
    await waitFor(() =>
      expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1),
    );
  });

  test("does nothing if the user closes the popup", async () => {
    mockSignInWithPopup.mockRejectedValueOnce(
      authError("auth/popup-closed-by-user"),
    );
    render(<AuthDialog />);
    clickSignInWithGoogle();
    await waitFor(() => expect(mockSignInWithPopup).toHaveBeenCalledTimes(1));
    // let the rejection be handled
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
    expect(
      screen.queryByText(i18n.t(AuthErrorMessage.UNKNOWN) as string, {
        exact: false,
      }),
    ).toBeNull();
  });

  test("shows an error if the sign in fails", async () => {
    mockSignInWithPopup.mockRejectedValueOnce(authError("auth/internal-error"));
    render(<AuthDialog />);
    clickSignInWithGoogle();
    await screen.findByText(i18n.t(AuthErrorMessage.UNKNOWN) as string, {
      exact: false,
    });
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });

  test("ignores further clicks while a sign in is in progress, and allows a retry after it ends", async () => {
    const first = deferred();
    const second = deferred();
    mockSignInWithPopup
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockResolvedValueOnce({});
    render(<AuthDialog />);

    // Repeated clicks while the first popup is open
    clickSignInWithGoogle();
    clickSignInWithGoogle();
    clickSignInWithGoogle();
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);

    // The user closes the popup: a new click starts a new sign in
    first.reject(authError("auth/popup-closed-by-user"));
    await flushPromises();
    clickSignInWithGoogle();
    clickSignInWithGoogle();
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(2);

    // The sign in fails: the error is shown and a new click retries
    second.reject(authError("auth/internal-error"));
    await screen.findByText(i18n.t(AuthErrorMessage.UNKNOWN) as string, {
      exact: false,
    });
    clickSignInWithGoogle();
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(3);
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });

  test("a popup that never settles doesn't start a second sign in", async () => {
    mockSignInWithPopup.mockReturnValueOnce(new Promise(() => {}));
    render(<AuthDialog />);
    clickSignInWithGoogle();
    await flushPromises();
    clickSignInWithGoogle();
    await flushPromises();
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });

  describe("in the iOS home-screen app", () => {
    afterEach(() => {
      delete (window.navigator as any).standalone;
    });

    test("uses the redirect flow: Firebase's popup there can hang forever", () => {
      Object.defineProperty(window.navigator, "standalone", {
        value: true,
        configurable: true,
      });
      render(<AuthDialog />);
      clickSignInWithGoogle();
      expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1);
      expect(mockSignInWithPopup).not.toHaveBeenCalled();
    });
  });
});
