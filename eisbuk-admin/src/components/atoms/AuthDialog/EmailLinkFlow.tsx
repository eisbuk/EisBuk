import React, { useEffect, useState } from "react";
import { Formik, Form, FormikConfig } from "formik";
import {
  getAuth,
  ActionCodeSettings,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
  AuthErrorCodes,
} from "@firebase/auth";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import { __isDev__ } from "@/lib/constants";

import {
  ActionButton as ActionButtonLabel,
  AuthMessage,
  AuthTitle,
  ValidationMessage,
} from "@/enums/translations";

import AuthContainer from "./AuthContainer";
import AuthErrorDialog from "./AuthErrorDialog";
import AuthTextField from "./AuthTextField";
import ActionButton from "./ActionButton";
import AuthTypography from "./AuthTypography";

import useAuthFlow from "@/hooks/useAuthFlow";

import {
  getEmailForSignIn,
  setEmailForSignIn,
  unsetEmailForSignIn,
} from "@/utils/localStorage";

/**
 * Enum containing values for all possible views of email auth flow
 */
enum AuthStep {
  /** Initial view (email prompt) */
  SendSignInLink = "SendSignInLink",
  /** 'Check your email' message (after sending sign link) */
  CheckYourEmail = "CheckYourEmail",
  /** 'Confirm email' prompt (if isSignInWithEmaiLink, but email doesn't exist in local storage) */
  ConfirmEmail = "ConfirmEmail",
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
}

type SubmitHandler = FormikConfig<CompleteFormValues>["onSubmit"];

interface Props {
  onCancel?: () => void;
}

const fieldErrorMap = {
  [AuthErrorCodes.INVALID_EMAIL]: "email",
};

const EmailFlow: React.FC<Props> = ({ onCancel = () => {} }) => {
  const { t } = useTranslation();

  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.SendSignInLink);

  const { dialogError, removeDialogError, handleSubmit } =
    useAuthFlow<CompleteFormValues>(fieldErrorMap);

  // check if site visited by sign in link

  // redirect to login-with-email-link if site visited by login link
  const handleSignInWithEmailLink = async (email: string) => {
    await signInWithEmailLink(getAuth(), email, window.location.href);
    unsetEmailForSignIn();
  };
  useEffect(() => {
    if (isSignInWithEmailLink(getAuth(), window.location.href)) {
      const email = getEmailForSignIn();
      if (email) {
        handleSignInWithEmailLink(email);
      } else {
        setAuthStep(AuthStep.ConfirmEmail);
      }
    }
  }, []);

  // #region form
  const initialValues = { email: "" };

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .required(t(ValidationMessage.RequiredField))
      .email(t(ValidationMessage.Email)),
  });
  // #endregion form

  // #region continueHandlers
  const submitHandlers = {} as Record<AuthStep, SubmitHandler>;
  submitHandlers[AuthStep.SendSignInLink] = async ({ email }) => {
    const auth = getAuth();
    const { host } = window.location;
    const proto = __isDev__ ? "http" : "https";
    const actionCodeSettings: ActionCodeSettings = {
      handleCodeInApp: true,
      url: `${proto}://${host}/login`,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    setEmailForSignIn(email);
    setAuthStep(AuthStep.CheckYourEmail);
  };
  // add an empty function for 'check email' step as there is no `onSubmit` for this step
  submitHandlers[AuthStep.CheckYourEmail] = async () => {};
  submitHandlers[AuthStep.ConfirmEmail] = ({ email }) =>
    handleSignInWithEmailLink(email);
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
  [AuthStep.SendSignInLink]: [{ name: "email", label: "Email", type: "email" }],
  [AuthStep.CheckYourEmail]: null,
  [AuthStep.ConfirmEmail]: [{ name: "email", label: "Email", type: "email" }],
};

const actionButtonLookup: Record<AuthStep, ActionButtonParams[]> = {
  [AuthStep.SendSignInLink]: [
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
  [AuthStep.ConfirmEmail]: [
    {
      label: ActionButtonLabel.Verify,
      variant: "fill",
      type: "submit",
    },
  ],
};

const messageLookup = {
  [AuthStep.CheckYourEmail]: AuthMessage.CheckSignInEmail,
  [AuthStep.ConfirmEmail]: AuthMessage.ConfirmSignInEmail,
};
// #endregion stepContentLookups

export default EmailFlow;
