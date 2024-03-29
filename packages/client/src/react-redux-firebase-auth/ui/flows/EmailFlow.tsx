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
import * as yup from "yup";

import { PrivateRoutes } from "@eisbuk/shared/ui";
import { normalizeEmail } from "@eisbuk/shared";
import {
  useTranslation,
  ActionButton as ActionButtonLabel,
  AuthMessage,
  AuthTitle,
  ValidationMessage,
} from "@eisbuk/translations";

import { EmailAuthStep } from "../../enums";

import AuthContainer from "../atoms/AuthContainer";
import AuthErrorDialog from "../atoms/AuthErrorDialog";
import AuthTextField, { AuthTextFieldLookup } from "../atoms/AuthTextField";
import ActionButton, { ActionButtonLookup } from "../atoms/ActionButton";
import AuthTypography from "../atoms/AuthTypography";

import useAuthFlow from "../../hooks/useAuthFlow";

interface CompleteFormValues {
  email: string;
  password: string;
}

type SubmitHandler = FormikConfig<CompleteFormValues>["onSubmit"];

interface Props {
  onCancel?: () => void;
}

const errorFieldMap = {
  [AuthErrorCodes.INVALID_PASSWORD]: "password",
};

const EmailFlow: React.FC<Props> = ({ onCancel = () => {} }) => {
  const history = useHistory();
  const { t } = useTranslation();

  const [authStep, setAuthStep] = useState<EmailAuthStep>(
    EmailAuthStep.SignInWithEmail
  );

  const { dialogError, removeDialogError, wrapSubmit } =
    useAuthFlow<CompleteFormValues>(errorFieldMap);

  // #region form
  const initialValues = { email: "", password: "" };

  const validationSchema = yup.object().shape({
    email: yup
      .string()
      .required(t(ValidationMessage.RequiredField))
      .email(t(ValidationMessage.Email)),
    ...(authStep === EmailAuthStep.CreateAccountEmailPassword
      ? {
          password: yup
            .string()
            .required(t(ValidationMessage.RequiredField))
            .min(6, t(ValidationMessage.WeakPassword, { min: 6 })),
        }
      : authStep === EmailAuthStep.SignInWithEmailPassword
      ? {
          password: yup.string().required(t(ValidationMessage.RequiredField)),
        }
      : {}),
  });
  // #endregion form

  // #region continueHandlers
  const submitHandlers = {} as Record<EmailAuthStep, SubmitHandler>;
  submitHandlers[EmailAuthStep.SignInWithEmail] = async ({ email }) => {
    const normalizedEmail = normalizeEmail(email);
    const signInMethods = await fetchSignInMethodsForEmail(
      getAuth(),
      normalizedEmail
    );
    if (signInMethods.includes("password")) {
      setAuthStep(EmailAuthStep.SignInWithEmailPassword);
    } else {
      setAuthStep(EmailAuthStep.CreateAccountEmailPassword);
    }
  };
  submitHandlers[EmailAuthStep.SignInWithEmailPassword] = async ({
    email,
    password,
  }) => {
    const normalizedEmail = normalizeEmail(email);

    const res = await signInWithEmailAndPassword(
      getAuth(),
      normalizedEmail,
      password
    );
    if (res.user.refreshToken) {
      history.push(PrivateRoutes.Root);
    }
  };
  submitHandlers[EmailAuthStep.CreateAccountEmailPassword] = async ({
    email,
    password,
  }) => {
    const normalizedEmail = normalizeEmail(email);

    await createUserWithEmailAndPassword(getAuth(), normalizedEmail, password);
  };
  submitHandlers[EmailAuthStep.RecoverEmailPassword] = async ({ email }) => {
    const normalizedEmail = normalizeEmail(email);

    await sendPasswordResetEmail(getAuth(), normalizedEmail);
    setAuthStep(EmailAuthStep.CheckPasswordRecoverEmail);
  };
  // add an empty function for 'check email' step as there is no `onSubmit` for this step
  submitHandlers[EmailAuthStep.CheckPasswordRecoverEmail] = async () => {};
  // #region continueHandlers

  const title = titleLookup[authStep] || AuthTitle[authStep];

  const message = [
    EmailAuthStep.CheckPasswordRecoverEmail,
    EmailAuthStep.RecoverEmailPassword,
  ].includes(authStep)
    ? AuthMessage[authStep]
    : undefined;

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

// #region stepContentLookups
/**
 * A lookup containing only the title strings different from the auth step itself,
 * i.e. `"SignInWithEmailPassword"` step has title `"AuthTitle.SignIn"` (and is listed in this lookup).
 * If no "special" title, for auth step, specified in this lookup, the title will simply be the same string used to
 * designate the auth step, i.e. `"SignInWithEmail"` will simply be `"AuthTitle.SignInWithEmail"`
 */
const titleLookup = {
  [EmailAuthStep.SignInWithEmailPassword]: AuthTitle.SignIn,
  [EmailAuthStep.CreateAccountEmailPassword]: AuthTitle.CreateAccount,
  [EmailAuthStep.CheckPasswordRecoverEmail]: AuthTitle.CheckYourEmail,
  [EmailAuthStep.RecoverEmailPassword]: AuthTitle.RecoverPassword,
};

/**
 * A lookup of input fields rendered for each auth step
 */
const fieldsLookup: AuthTextFieldLookup<EmailAuthStep> = {
  [EmailAuthStep.SignInWithEmail]: [
    { name: "email", label: "Email", type: "email", autoFocus: true },
  ],
  [EmailAuthStep.SignInWithEmailPassword]: [
    { name: "email", label: "Email", type: "email" },
    { name: "password", label: "Password", type: "password", autoFocus: true },
  ],
  [EmailAuthStep.CreateAccountEmailPassword]: [
    { name: "email", label: "Email", type: "email" },
    { name: "password", label: "Password", type: "password", autoFocus: true },
  ],
  [EmailAuthStep.RecoverEmailPassword]: [
    { name: "email", label: "Email", type: "email" },
  ],
};

/**
 * A lookup of action buttons for each auth step
 */
const actionButtonLookup: ActionButtonLookup<EmailAuthStep> = {
  [EmailAuthStep.SignInWithEmail]: [
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
  [EmailAuthStep.SignInWithEmailPassword]: [
    {
      label: ActionButtonLabel.TroubleSigningIn,
      variant: "text",
      nextStep: EmailAuthStep.RecoverEmailPassword,
      type: "button",
    },
    {
      label: ActionButtonLabel.SignIn,
      variant: "fill",
      type: "submit",
    },
  ],
  [EmailAuthStep.CreateAccountEmailPassword]: [
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
  [EmailAuthStep.RecoverEmailPassword]: [
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
  [EmailAuthStep.CheckPasswordRecoverEmail]: [
    {
      label: ActionButtonLabel.Done,
      variant: "fill",
      type: "reset",
    },
  ],
};
// #endregion stepContentLookups

export default EmailFlow;
