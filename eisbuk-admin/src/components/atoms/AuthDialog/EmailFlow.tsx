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
import { useTranslation } from "react-i18next";

import {
  ActionButton as ActionButtonLabel,
  AuthMessage,
  AuthTitle,
} from "@/enums/translations";
import { PrivateRoutes } from "@/enums/routes";

import AuthContainer from "./AuthContainer";
import AuthTextField from "./AuthTextField";
import ActionButton from "./ActionButton";
import AuthTypography from "./AuthTypography";

/**
 * Enum containing values for all possible views of email auth flow
 */
enum AuthStep {
  /** Initial view (only email prompt) */
  SignInWithEmail = "SignInWithEmail",
  /** Sign in view (after email verified as registered) */
  SignIn = "SignIn",
  /** Sign up view (after email verified as valid, but not registered) */
  CreateAccount = "CreateAccount",
  /** Help message (after `Trouble signing in?` click) */
  RecoverPassword = "RecoverPassword",
  /** 'Check your email' message (after sending reset password email) */
  CheckYourEmail = "CheckYourEmail",
}

interface ActionButtonParams {
  label: ActionButtonLabel;
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
  const history = useHistory();
  const { t } = useTranslation();

  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.SignInWithEmail);

  // #region form
  const initialValues = { email: "", password: "", name: "" };
  // #endregion form

  // #region continueHandlers
  const submitHandlers = {} as Record<AuthStep, SubmitHandler>;
  submitHandlers[AuthStep.SignInWithEmail] = async ({ email }) => {
    const signInMethods = await fetchSignInMethodsForEmail(getAuth(), email);
    if (signInMethods.includes("password")) {
      setAuthStep(AuthStep.SignIn);
    } else {
      setAuthStep(AuthStep.CreateAccount);
    }
  };
  submitHandlers[AuthStep.SignIn] = async ({ email, password }) => {
    const res = await signInWithEmailAndPassword(getAuth(), email, password);
    if (res.user.refreshToken) {
      history.push(PrivateRoutes.Root);
    }
  };
  submitHandlers[AuthStep.CreateAccount] = async ({ email, password }) => {
    const res = await createUserWithEmailAndPassword(
      getAuth(),
      email,
      password
    );
    if (res.user.refreshToken) {
      history.push(PrivateRoutes.Root);
    }
  };
  submitHandlers[AuthStep.RecoverPassword] = async ({ email }) => {
    await sendPasswordResetEmail(getAuth(), email);
    setAuthStep(AuthStep.CheckYourEmail);
  };
  // add an empty function for 'check email' step as there is no `onSubmit` for this step
  submitHandlers[AuthStep.CheckYourEmail] = async () => {};
  // #region continueHandlers

  const message = [AuthStep.RecoverPassword, AuthStep.CheckYourEmail].includes(
    authStep
  )
    ? AuthMessage[authStep]
    : null;

  return (
    <AuthContainer>
      {({ Header, Content, ActionButtons, TextMessage }) => (
        <Formik onSubmit={submitHandlers[authStep]} {...{ initialValues }}>
          {({ values: { email } }) => (
            <Form onReset={onCancel}>
              <Header>{t(AuthTitle[authStep])}</Header>
              {message && (
                <TextMessage>
                  <AuthTypography variant="body1">
                    {t(message, { email })}
                  </AuthTypography>
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
                      {t(label)}
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
const fieldsLookup: Record<AuthStep, AuthFieldParams[] | null> = {
  [AuthStep.SignInWithEmail]: [
    { name: "email", label: "Email", type: "email" },
  ],
  [AuthStep.SignIn]: [
    { name: "email", label: "Email", type: "email" },
    { name: "password", label: "Password", type: "password" },
  ],
  [AuthStep.CreateAccount]: [
    { name: "email", label: "Email", type: "email" },
    { name: "name", label: "First & last name", type: "text" },
    { name: "password", label: "Password", type: "password" },
  ],
  [AuthStep.RecoverPassword]: [
    { name: "email", label: "Email", type: "email" },
  ],
  [AuthStep.CheckYourEmail]: null,
};

const actionButtonLookup: Record<AuthStep, ActionButtonParams[]> = {
  [AuthStep.SignInWithEmail]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Next,
      variant: "fill",
      type: "submit",
    },
  ],
  [AuthStep.SignIn]: [
    {
      label: ActionButtonLabel.TroubleSigningIn,
      variant: "text",
      nextStep: AuthStep.RecoverPassword,
    },
    {
      label: ActionButtonLabel.SignIn,
      variant: "fill",
      type: "submit",
    },
  ],
  [AuthStep.CreateAccount]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Save,
      variant: "fill",
      type: "submit",
    },
  ],
  [AuthStep.RecoverPassword]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Send,
      variant: "fill",
      type: "submit",
    },
  ],
  [AuthStep.CheckYourEmail]: [
    {
      label: ActionButtonLabel.Done,
      variant: "fill",
      type: "reset",
    },
  ],
};
// #endregion stepContentLookups

export default EmailFlow;
