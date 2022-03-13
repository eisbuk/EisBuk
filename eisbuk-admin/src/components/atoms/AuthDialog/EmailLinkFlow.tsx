import React, { useState } from "react";
import { Formik, Form, FormikConfig } from "formik";
import {
  getAuth,
  ActionCodeSettings,
  sendSignInLinkToEmail,
} from "@firebase/auth";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

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

import { setEmailForSignIn } from "@/utils/localStorage";

/**
 * Enum containing values for all possible views of email auth flow
 */
enum AuthStep {
  /** Initial view (email prompt) */
  SendLink = "SignInWithEmail",
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
}

type SubmitHandler = FormikConfig<CompleteFormValues>["onSubmit"];

interface Props {
  onCancel?: () => void;
}

const EmailFlow: React.FC<Props> = ({ onCancel = () => {} }) => {
  const { t } = useTranslation();

  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.SendLink);

  const { dialogError, removeDialogError, handleSubmit } =
    useAuthFlow<CompleteFormValues>({});

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
  submitHandlers[AuthStep.SendLink] = async ({ email }) => {
    const auth = getAuth();
    const { host } = window.location;
    const actionCodeSettings: ActionCodeSettings = {
      handleCodeInApp: true,
      url: `http://${host}/login`,
    };
    console.log("Link: ", actionCodeSettings.url);
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    setEmailForSignIn(email);
  };
  // add an empty function for 'check email' step as there is no `onSubmit` for this step
  submitHandlers[AuthStep.CheckYourEmail] = async () => {};
  // #region continueHandlers

  const message =
    authStep === AuthStep.CheckYourEmail ? AuthMessage[authStep] : null;

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
  [AuthStep.SendLink]: [{ name: "email", label: "Email", type: "email" }],
  [AuthStep.CheckYourEmail]: null,
};

const actionButtonLookup: Record<AuthStep, ActionButtonParams[]> = {
  [AuthStep.SendLink]: [
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
