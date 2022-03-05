/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import * as auth from "@firebase/auth";

import { PrivateRoutes } from "@/enums/routes";
import { ActionButton, AuthMessage, AuthTitle } from "@/enums/translations";

import EmailFlow from "../EmailFlow";

import i18n from "@/__testUtils__/i18n";

// mock `getAuth` to always return a string
// (rather than an object) for easier mocking/testing
const mockAuth: any = "fake-auth";
jest.spyOn(auth, "getAuth").mockReturnValue(mockAuth);

const mockHistoryPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => ({ push: mockHistoryPush }),
}));

describe("AuthDialog", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  xdescribe("Smoke test", () => {});

  describe("Email flow", () => {
    test("should render only the email field on first step", () => {
      render(<EmailFlow />);
      screen.getByLabelText("Email");
      screen.getByText("Sign in with email");
      expect(screen.queryByLabelText("Password")).toBeFalsy();
      expect(screen.queryByLabelText("First & last name")).toBeFalsy();
    });

    test("should check if email registered on 'next' button click", async () => {
      const mockOnCancel = jest.fn();
      render(<EmailFlow onCancel={mockOnCancel} />);
      const emailField = screen.getByLabelText("Email");
      userEvent.type(emailField, "test@eisbuk.it");
      const mockVerifyEmail = jest
        .spyOn(auth, "fetchSignInMethodsForEmail")
        .mockImplementationOnce((() => {}) as any);
      // should call on cancel on 'cancel' button click
      screen.getByText(i18n.t(ActionButton.Cancel) as string).click();
      expect(mockOnCancel).toHaveBeenCalled();
      // "submit" email to check if user exists or should be created
      screen.getByText(i18n.t(ActionButton.Next) as string).click();
      await waitFor(() =>
        expect(mockVerifyEmail).toHaveBeenCalledWith(mockAuth, "test@eisbuk.it")
      );
    });

    test("should sign in using email and password if email registered", async () => {
      render(<EmailFlow />);
      const emailField = screen.getByRole("textbox");
      userEvent.type(emailField, "test@eisbuk.it");
      const mockVerifyEmail = jest
        .spyOn(auth, "fetchSignInMethodsForEmail")
        .mockImplementationOnce((() => Promise.resolve(["password"])) as any);
      screen.getByText(i18n.t(ActionButton.Next) as string).click();
      const passwordInput = await screen.findByLabelText("Password");
      userEvent.type(passwordInput, "test00");
      const emailSigninMock = jest
        .spyOn(auth, "signInWithEmailAndPassword")
        .mockImplementation(() =>
          Promise.resolve({ user: { refreshToken: "fake-token" } } as any)
        );
      screen.getByText(i18n.t(ActionButton.SignIn) as string).click();
      await waitFor(() =>
        expect(emailSigninMock).toHaveBeenCalledWith(
          mockAuth,
          "test@eisbuk.it",
          "test00"
        )
      );
      expect(mockVerifyEmail).toHaveBeenCalledTimes(1);
      // should redirect to  private route "/"
      expect(mockHistoryPush).toHaveBeenCalledWith(PrivateRoutes.Root);
    });

    test("should display signup help message on 'trouble signing in' click", async () => {
      const mockOnCancel = jest.fn();
      render(<EmailFlow onCancel={mockOnCancel} />);
      const emailField = screen.getByRole("textbox");
      userEvent.type(emailField, "test@eisbuk.it");
      jest
        .spyOn(auth, "fetchSignInMethodsForEmail")
        .mockImplementationOnce((() => Promise.resolve(["password"])) as any);
      screen.getByText(i18n.t(ActionButton.Next) as string).click();
      await screen.findByLabelText("Password");
      screen.getByText(i18n.t(ActionButton.TroubleSigningIn) as string).click();
      await screen.findByText(i18n.t(AuthTitle.RecoverPassword) as string);
      await screen.findByText(i18n.t(AuthMessage.RecoverPassword) as string);
      screen.getByText(i18n.t(ActionButton.Send) as string).click();
      const resetPasswordSpy = jest
        .spyOn(auth, "sendPasswordResetEmail")
        .mockImplementation(() => Promise.resolve());
      await waitFor(() =>
        expect(resetPasswordSpy).toHaveBeenCalledWith(
          mockAuth,
          "test@eisbuk.it"
        )
      );
      await screen.findByText(i18n.t(AuthTitle.CheckYourEmail) as string);
      await screen.findByText(
        i18n.t(AuthMessage.CheckYourEmail, {
          email: "test@eisbuk.it",
        }) as string
      );
      // check done button call
      screen.getByText(i18n.t(ActionButton.Done) as string).click();
      expect(mockOnCancel).toHaveBeenCalled();
    });

    test("should prompt to register new user if email not registered", async () => {
      const mockOnCancel = jest.fn();
      render(<EmailFlow onCancel={mockOnCancel} />);
      const emailField = screen.getByRole("textbox");
      userEvent.type(emailField, "test@eisbuk.it");
      const mockVerifyEmail = jest
        .spyOn(auth, "fetchSignInMethodsForEmail")
        // return empty sign in method array (signaling the email not registered)
        .mockImplementationOnce((() => Promise.resolve([])) as any);
      screen.getByText(i18n.t(ActionButton.Next) as string).click();
      const nameInput = await screen.findByLabelText(/first & last name/i);
      const passwordInput = await screen.findByLabelText("Password");
      userEvent.type(nameInput, "Saul Goodman");
      userEvent.type(passwordInput, "test00");
      const emailSignupMock = jest
        .spyOn(auth, "createUserWithEmailAndPassword")
        .mockImplementation((() =>
          Promise.resolve({ user: { refreshToken: "fake-token" } })) as any);
      // check 'cancel' button click
      screen.getByText(/cancel/i).click();
      expect(mockOnCancel).toHaveBeenCalled();
      screen.getByText(/save/i).click();
      screen.getByText(/save/i).click();
      await waitFor(() =>
        expect(emailSignupMock).toHaveBeenCalledWith(
          mockAuth,
          "test@eisbuk.it",
          "test00"
        )
      );
      expect(mockVerifyEmail).toHaveBeenCalledTimes(1);
      // should redirect to  private route "/"
      expect(mockHistoryPush).toHaveBeenCalledWith(PrivateRoutes.Root);
    });
  });
});
