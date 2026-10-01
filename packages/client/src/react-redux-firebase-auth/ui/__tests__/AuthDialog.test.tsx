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
});
