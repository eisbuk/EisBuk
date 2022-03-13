import React, { useState } from "react";
import { Formik, Form, FormikConfig } from "formik";
import {
  getAuth,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  AuthErrorCodes,
} from "@firebase/auth";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import {
  ActionButton as ActionButtonLabel,
  AuthMessage,
  AuthTitle,
  ValidationMessage,
} from "@/enums/translations";
import { PrivateRoutes } from "@/enums/routes";

import AuthContainer from "./AuthContainer";
import AuthErrorDialog from "./AuthErrorDialog";
import AuthTextField from "./AuthTextField";
import ActionButton from "./ActionButton";
import AuthTypography from "./AuthTypography";
import useAuthFlow from "@/hooks/useAuthFlow";

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

const fieldErrorMap = {
  [AuthErrorCodes.INVALID_PASSWORD]: "password",
};

const EmailFlow: React.FC<Props> = ({ onCancel = () => {} }) => {
  const history = useHistory();
  const { t } = useTranslation();

  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.SignInWithEmail);

  const { dialogError, removeDialogError, handleSubmit } =
    useAuthFlow<CompleteFormValues>(fieldErrorMap);

  // #region form
  const initialValues = { email: "", password: "", name: "" };

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .required(t(ValidationMessage.RequiredField))
      .email(t(ValidationMessage.Email)),
    ...(authStep === AuthStep.CreateAccount
      ? {
          name: yup.string().required(t(ValidationMessage.RequiredField)),
          password: yup
            .string()
            .required(t(ValidationMessage.RequiredField))
            .min(6, t(ValidationMessage.WeakPassword, { min: 6 })),
        }
      : authStep === AuthStep.SignIn
      ? {
          password: yup.string().required(t(ValidationMessage.RequiredField)),
        }
      : {}),
  });
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
    await createUserWithEmailAndPassword(getAuth(), email, password);
  };
  submitHandlers[AuthStep.RecoverPassword] = async ({ email }) => {
    await sendPasswordResetEmail(getAuth(), email);
    setAuthStep(AuthStep.CheckYourEmail);
  };
  // add an empty function for 'check email' step as there is no `onSubmit` for this step
  submitHandlers[AuthStep.CheckYourEmail] = async () => {};
  // #region continueHandlers

  const message = messageLookup[authStep];

  return (
    <AuthContainer>
      {({ Header, Content, ActionButtons, TextMessage }) => (
        <>
          <AuthErrorDialog
            message={dialogError || ""}
            open={Boolean(dialogError)}
            onClose={removeDialogError}
          />
          <Formik
            onSubmit={handleSubmit(submitHandlers[authStep])}
            {...{ initialValues, validationSchema }}
          >
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
        </>
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

const messageLookup = {
  [AuthStep.CheckYourEmail]: AuthMessage.CheckPasswordRecoverEmail,
  [AuthStep.RecoverPassword]: AuthMessage.RecoverPassword,
};
// #endregion stepContentLookups

export default EmailFlow;
