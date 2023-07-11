import React, { useEffect, useState } from "react";
import { Formik, Form, FormikConfig } from "formik";
import {
  getAuth,
  ActionCodeSettings,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
  AuthErrorCodes,
  AuthError,
} from "@firebase/auth";
import * as yup from "yup";

import {
  useTranslation,
  ActionButton as ActionButtonLabel,
  AuthMessage,
  AuthTitle,
  ValidationMessage,
} from "@eisbuk/translations";

import { __isDev__ } from "@/lib/constants";

import { EmailLinkAuthStep } from "../../enums";

import AuthContainer from "../atoms/AuthContainer";
import AuthErrorDialog from "../atoms/AuthErrorDialog";
import AuthTextField, { AuthTextFieldLookup } from "../atoms/AuthTextField";
import ActionButton, { ActionButtonLookup } from "../atoms/ActionButton";
import AuthTypography from "../atoms/AuthTypography";

import useAuthFlow from "../../hooks/useAuthFlow";

import {
  getEmailForSignIn,
  setEmailForSignIn,
  unsetEmailForSignIn,
} from "@/utils/localStorage";

interface CompleteFormValues {
  email: string;
}

type SubmitHandler = FormikConfig<CompleteFormValues>["onSubmit"];

interface Props {
  onCancel?: () => void;
}

const errorFieldMap = {
  [AuthErrorCodes.INVALID_EMAIL]: "email",
};

const EmailFlow: React.FC<Props> = ({ onCancel = () => {} }) => {
  const { t } = useTranslation();

  const [authStep, setAuthStep] = useState<EmailLinkAuthStep>(
    EmailLinkAuthStep.SendSignInLink
  );

  const { dialogError, removeDialogError, wrapSubmit } =
    useAuthFlow<CompleteFormValues>(errorFieldMap);

  // redirect to login-with-email-link if site visited by login link
  useEffect(() => {
    if (isSignInWithEmailLink(getAuth(), window.location.href)) {
      const email = getEmailForSignIn();
      if (email) {
        handleSignInWithEmailLink(email).catch((error) => {
          const { code } = error as AuthError;
          switch (code) {
            case AuthErrorCodes.INVALID_EMAIL:
              setAuthStep(EmailLinkAuthStep.DifferentSignInEmail);
              break;
            case AuthErrorCodes.INVALID_OOB_CODE:
            case AuthErrorCodes.EXPIRED_OOB_CODE:
              setAuthStep(EmailLinkAuthStep.ResendEmailLink);
          }
        });
      } else {
        setAuthStep(EmailLinkAuthStep.ConfirmSignInEmail);
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
  const submitHandlers = {} as Record<EmailLinkAuthStep, SubmitHandler>;
  submitHandlers[EmailLinkAuthStep.SendSignInLink] = async ({ email }) => {
    const auth = getAuth();
    const { host } = window.location;
    const proto = __isDev__ ? "http" : "https";
    const actionCodeSettings: ActionCodeSettings = {
      handleCodeInApp: true,
      url: `${proto}://${host}/login`,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    setEmailForSignIn(email);
    setAuthStep(EmailLinkAuthStep.CheckSignInEmail);
  };

  submitHandlers[EmailLinkAuthStep.CheckSignInEmail] = async () => {};

  submitHandlers[EmailLinkAuthStep.ConfirmSignInEmail] = ({ email }) =>
    handleSignInWithEmailLink(email);

  submitHandlers[EmailLinkAuthStep.DifferentSignInEmail] =
    submitHandlers[EmailLinkAuthStep.ConfirmSignInEmail];

  submitHandlers[EmailLinkAuthStep.ResendEmailLink] =
    submitHandlers[EmailLinkAuthStep.SendSignInLink];
  // #region continueHandlers

  const title = titleLookup[authStep] || AuthTitle[authStep];
  const message = AuthMessage[authStep];

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
            onSubmit={wrapSubmit(submitHandlers[authStep])}
            {...{ initialValues, validationSchema }}
          >
            {({ values: { email } }) => (
              <Form onReset={onCancel}>
                <Header>{t(title)}</Header>
                {message && (
                  <TextMessage>
                    <AuthTypography variant="body">
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
                  {actionButtonLookup[authStep]?.map(
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

const handleSignInWithEmailLink = async (email: string) => {
  await signInWithEmailLink(getAuth(), email, window.location.href);
  unsetEmailForSignIn();
};

// #region stepContentLookups
const titleLookup = {
  [EmailLinkAuthStep.CheckSignInEmail]: AuthTitle.CheckYourEmail,
  [EmailLinkAuthStep.ConfirmSignInEmail]: AuthTitle.ConfirmEmail,
  [EmailLinkAuthStep.DifferentSignInEmail]: AuthTitle.ConfirmEmail,
  [EmailLinkAuthStep.ResendEmailLink]: AuthTitle.ResendEmail,
};

const fieldsLookup: AuthTextFieldLookup<EmailLinkAuthStep> = Object.values(
  EmailLinkAuthStep
).reduce(
  (acc, authStep) =>
    authStep !== EmailLinkAuthStep.CheckSignInEmail
      ? {
          ...acc,
          // all auth steps except for `EmailLinkAuthStep.CheckSignInEmail` have the same (email) input field
          [authStep]: [
            { name: "email", label: "Email", type: "email", autoFocus: true },
          ],
        }
      : acc,
  {}
);

const actionButtonLookup: ActionButtonLookup<EmailLinkAuthStep> = {
  [EmailLinkAuthStep.SendSignInLink]: [
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
  [EmailLinkAuthStep.CheckSignInEmail]: [
    {
      label: ActionButtonLabel.Done,
      variant: "fill",
      type: "reset",
    },
  ],
  [EmailLinkAuthStep.ConfirmSignInEmail]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Verify,
      variant: "fill",
      type: "submit",
    },
  ],
  [EmailLinkAuthStep.DifferentSignInEmail]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Verify,
      variant: "fill",
      type: "submit",
    },
  ],
  [EmailLinkAuthStep.ResendEmailLink]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Resend,
      variant: "fill",
      type: "submit",
    },
  ],
};
// #endregion stepContentLookups

export default EmailFlow;
