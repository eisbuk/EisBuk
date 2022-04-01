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
import * as yup from "yup";

import {
  useTranslation,
  ActionButton as ActionButtonLabel,
  AuthMessage,
  AuthTitle,
  ValidationMessage,
} from "@eisbuk/translations";

import { __isDev__ } from "@/lib/constants";

import { EmailLinkAuthStep } from "@/enums/authSteps";

import AuthContainer from "./AuthContainer";
import AuthErrorDialog from "./AuthErrorDialog";
import AuthTextField, { AuthTextFieldLookup } from "./AuthTextField";
import ActionButton, { ActionButtonLookup } from "./ActionButton";
import AuthTypography from "./AuthTypography";

import useAuthFlow from "@/hooks/useAuthFlow";

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

const fieldErrorMap = {
  [AuthErrorCodes.INVALID_EMAIL]: "email",
};

const EmailFlow: React.FC<Props> = ({ onCancel = () => {} }) => {
  const { t } = useTranslation();

  const [authStep, setAuthStep] = useState<EmailLinkAuthStep>(
    EmailLinkAuthStep.SendSignInLink
  );

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
  // add an empty function for 'check email' step as there is no `onSubmit` for this step
  submitHandlers[EmailLinkAuthStep.CheckSignInEmail] = async () => {};
  submitHandlers[EmailLinkAuthStep.ConfirmSignInEmail] = ({ email }) =>
    handleSignInWithEmailLink(email);
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
            onSubmit={handleSubmit(submitHandlers[authStep])}
            {...{ initialValues, validationSchema }}
          >
            {({ values: { email } }) => (
              <Form onReset={onCancel}>
                <Header>{t(title)}</Header>
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

// #region stepContentLookups
const titleLookup = {
  [EmailLinkAuthStep.CheckSignInEmail]: AuthTitle.CheckYourEmail,
  [EmailLinkAuthStep.ConfirmSignInEmail]: AuthTitle.ConfirmEmail,
};

const fieldsLookup: AuthTextFieldLookup<EmailLinkAuthStep> = {
  [EmailLinkAuthStep.SendSignInLink]: [
    { name: "email", label: "Email", type: "email" },
  ],
  [EmailLinkAuthStep.ConfirmSignInEmail]: [
    { name: "email", label: "Email", type: "email" },
  ],
};

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
};
// #endregion stepContentLookups

export default EmailFlow;