import React, { useState } from "react";
import { Formik, Form, FormikConfig } from "formik";
import {
  getAuth,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "@firebase/auth";
import { useHistory } from "react-router-dom";

import AuthContainer from "./AuthContainer";
import AuthTextField from "./AuthTextField";
import ActionButton from "./ActionButton";
import { PrivateRoutes } from "@/enums/routes";
import AuthTypography from "./AuthTypography";

/**
 * Enum containing values for all possible views of email auth flow
 */
enum AuthStep {
  /** Initial view (only email prompt) */
  Email = "email",
  /** Sign in view (after email verified as registered) */
  SignIn = "signin",
  /** Sign up view (after email verified as valid, but not registered) */
  SignUp = "Signup",
  /** Help message (after `Trouble signing in?` click) */
  Help = "help",
  /** 'Check your email' message (after sending reset password email) */
  CheckYourEmail = "checkYourEmail",
}

interface ActionButtonParams {
  label: string;
  variant: "empty" | "fill" | "text";
  type?: "reset" | "submit";
  nextStep?: AuthStep;
}

interface AuthFieldParams {
  name: string;
  label: string;
  type: "email" | "password" | "text";
}

interface CompleteFormValues {
  email: string;
  password: string;
  name: string;
}

type SubmitHandler = FormikConfig<CompleteFormValues>["onSubmit"];

interface Props {
  onCancel?: () => void;
}

const EmailFlow: React.FC<Props> = ({ onCancel = () => {} }) => {
  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.Email);
  const history = useHistory();

  // #region form
  const initialValues = { email: "", password: "", name: "" };
  // #endregion form

  // #region continueHandlers
  const submitHandlers = {} as Record<AuthStep, SubmitHandler>;
  submitHandlers[AuthStep.Email] = async ({ email }) => {
    const signInMethods = await fetchSignInMethodsForEmail(getAuth(), email);
    if (signInMethods.includes("password")) {
      setAuthStep(AuthStep.SignIn);
    } else {
      setAuthStep(AuthStep.SignUp);
    }
  };
  submitHandlers[AuthStep.SignIn] = async ({ email, password }) => {
    const res = await signInWithEmailAndPassword(getAuth(), email, password);
    if (res.user.refreshToken) {
      history.push(PrivateRoutes.Root);
    }
  };
  submitHandlers[AuthStep.SignUp] = async ({ email, password }) => {
    const res = await createUserWithEmailAndPassword(
      getAuth(),
      email,
      password
    );
    if (res.user.refreshToken) {
      history.push(PrivateRoutes.Root);
    }
  };
  submitHandlers[AuthStep.Help] = async ({ email }) => {
    await sendPasswordResetEmail(getAuth(), email);
    setAuthStep(AuthStep.CheckYourEmail);
  };
  // add an empty function for 'check email' step as there is no `onSubmit` for this step
  submitHandlers[AuthStep.CheckYourEmail] = async () => {};
  // #region continueHandlers

  const message =
    authStep === AuthStep.Help
      ? "Get instructions sent to this email that explain how to reset your password"
      : authStep === AuthStep.CheckYourEmail
      ? "Follow the instructions sent to <email-here> to recover your password"
      : null;

  return (
    <AuthContainer>
      {({ Header, Content, ActionButtons, TextMessage }) => (
        <Formik onSubmit={submitHandlers[authStep]} {...{ initialValues }}>
          {() => (
            <Form onReset={onCancel}>
              <Header>{titleLookup[authStep]}</Header>
              {message && (
                <TextMessage>
                  <AuthTypography variant="body1">{message}</AuthTypography>
                </TextMessage>
              )}

              <Content>
                {fieldsLookup[authStep]?.map((fieldProps) => (
                  <AuthTextField
                    {...fieldProps}
                    key={fieldProps.name}
                    id={fieldProps.name}
                  />
                ))}
              </Content>

              <ActionButtons>
                {actionButtonLookup[authStep].map(
                  ({ nextStep, label, ...buttonProps }) => (
                    <ActionButton
                      key={label}
                      {...{
                        ...buttonProps,
                        // add onClick handler only if nextStep specified
                        // (otherwise actions are controlled through `onSubmit`/`onReset`)
                        ...(nextStep
                          ? { onClick: () => setAuthStep(nextStep) }
                          : {}),
                      }}
                    >
                      {label}
                    </ActionButton>
                  )
                )}
              </ActionButtons>
            </Form>
          )}
        </Formik>
      )}
    </AuthContainer>
  );
};

// #region stepContentLookups
const titleLookup = {
  [AuthStep.Email]: "Sign in with email",
  [AuthStep.SignIn]: "Sign in",
  [AuthStep.SignUp]: "Create account",
  [AuthStep.Help]: "Recover password",
  [AuthStep.CheckYourEmail]: "Check your email",
};

const fieldsLookup: Record<AuthStep, AuthFieldParams[] | null> = {
  [AuthStep.Email]: [{ name: "email", label: "Email", type: "email" }],
  [AuthStep.SignIn]: [
    { name: "email", label: "Email", type: "email" },
    { name: "password", label: "Password", type: "password" },
  ],
  [AuthStep.SignUp]: [
    { name: "email", label: "Email", type: "email" },
    { name: "name", label: "First & last name", type: "text" },
    { name: "password", label: "Password", type: "password" },
  ],
  [AuthStep.Help]: [{ name: "email", label: "Email", type: "email" }],
  [AuthStep.CheckYourEmail]: null,
};

const actionButtonLookup: Record<AuthStep, ActionButtonParams[]> = {
  [AuthStep.Email]: [
    {
      label: "Cancel",
      variant: "empty",
      type: "reset",
    },
    {
      label: "Next",
      variant: "fill",
      type: "submit",
    },
  ],
  [AuthStep.SignIn]: [
    {
      label: "Trouble signing in?",
      variant: "text",
      nextStep: AuthStep.Help,
    },
    {
      label: "Signin",
      variant: "fill",
      type: "submit",
    },
  ],
  [AuthStep.SignUp]: [
    {
      label: "Cancel",
      variant: "empty",
      type: "reset",
    },
    {
      label: "Save",
      variant: "fill",
      type: "submit",
    },
  ],
  [AuthStep.Help]: [
    {
      label: "Cancel",
      variant: "empty",
      type: "reset",
    },
    {
      label: "Send",
      variant: "fill",
      type: "submit",
    },
  ],
  [AuthStep.CheckYourEmail]: [
    {
      label: "Done",
      variant: "fill",
      type: "reset",
    },
  ],
};
// #endregion stepContentLookups

export default EmailFlow;
