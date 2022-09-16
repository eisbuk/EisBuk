import React, { useState } from "react";
import { Formik, Form, FormikConfig } from "formik";
import {
  getAuth,
  RecaptchaVerifier,
  ConfirmationResult,
  signInWithPhoneNumber,
} from "@firebase/auth";
import * as yup from "yup";

import {
  useTranslation,
  AuthMessage,
  AuthTitle,
  ValidationMessage,
  ActionButton as ActionButtonLabel,
} from "@eisbuk/translations";

import { PhoneAuthStep } from "../../enums";

import AuthContainer from "../atoms/AuthContainer";
import AuthTypography from "../atoms/AuthTypography";
import AuthTextField, { AuthTextFieldLookup } from "../atoms/AuthTextField";
import ActionButton, { ActionButtonLookup } from "../atoms/ActionButton";
import AuthErrorDialog from "../atoms/AuthErrorDialog";

import useAuthFlow from "../../hooks/useAuthFlow";

import { isValidPhoneNumber } from "@/utils/helpers";
import { useSelector } from "react-redux";
import { getDefaultCountryCode } from "@/store/selectors/orgInfo";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

interface FullFormValues {
  phone: string;
  code: string;
}

type SubmitHandler = FormikConfig<FullFormValues>["onSubmit"];

const PhoneFlow: React.FC<{ onCancel?: () => void }> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCancel = () => {},
}) => {
  const { t } = useTranslation();

  const [authStep, setAuthStep] = useState(PhoneAuthStep.SignInWithPhone);

  const { wrapSubmit, dialogError, removeDialogError } =
    useAuthFlow<FullFormValues>({});

  /** Country code e.g. `+39` for Italy */
  const defaultCountryCode = useSelector(getDefaultCountryCode);

  // #region form

  const initialValues = { phone: "", code: "" };

  const validationSchema = yup.object().shape({
    phone: yup
      .string()
      .required(t(ValidationMessage.RequiredField))
      .test({
        // We don't forget to add the country code to the phone input
        // when validating input
        test: (input) => isValidPhoneNumber(input),
        message: t(ValidationMessage.InvalidPhone),
      }),
    ...(authStep === PhoneAuthStep.EnterSMSCode
      ? { code: yup.string().required(t(ValidationMessage.RequiredField)) }
      : {}),
  });
  // #endregion form

  const submitHandlers = {} as Record<PhoneAuthStep, SubmitHandler>;
  submitHandlers[PhoneAuthStep.SignInWithPhone] = async ({ phone }) => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "submit-phone",
      {
        size: "invisible",
      },
      getAuth()
    );
    const verifier = window.recaptchaVerifier;
    await verifier.verify();
    const res = await signInWithPhoneNumber(
      getAuth(),
      phone,
      window.recaptchaVerifier
    );
    window.confirmationResult = res;
    setAuthStep(PhoneAuthStep.EnterSMSCode);
  };
  submitHandlers[PhoneAuthStep.EnterSMSCode] = async ({ code }) => {
    await window.confirmationResult.confirm(code);
  };
  submitHandlers[PhoneAuthStep.ResendSMS] =
    submitHandlers[PhoneAuthStep.SignInWithPhone];

  const title = titleLookup[authStep] || AuthTitle[authStep];

  const message = AuthMessage[authStep];

  const footerMessage = footerMessageLookup[authStep];

  return (
    <AuthContainer>
      {({ Header, Content, Footer, ActionButtons, TextMessage }) => (
        <Formik
          onSubmit={wrapSubmit(submitHandlers[authStep])}
          onReset={onCancel}
          {...{ initialValues, validationSchema }}
        >
          {({ values: { phone } }) => (
            <Form>
              <AuthErrorDialog
                open={Boolean(dialogError)}
                message={dialogError || ""}
                onClose={removeDialogError}
              />
              <Header>{t(title)}</Header>

              {message && (
                <TextMessage>
                  <AuthTypography variant="body">
                    {t(message, { phone })}
                  </AuthTypography>
                </TextMessage>
              )}

              <Content>
                {fieldsLookup[authStep]?.map((inputProps) => (
                  <AuthTextField
                    {...inputProps}
                    // Pass default country code to phone input
                    {...(inputProps.type === "tel"
                      ? { defaultDialCode: defaultCountryCode }
                      : {})}
                  />
                ))}
              </Content>
              <ActionButtons>
                {actionButtonLookup[authStep]?.map(
                  ({ label, nextStep, ...buttonProps }) => (
                    <ActionButton
                      key={label}
                      {...buttonProps}
                      {
                        // add onClick handler only if nextStep specified
                        // (otherwise actions are controlled through `onSubmit`/`onReset`)
                        ...(nextStep
                          ? { onClick: () => setAuthStep(nextStep) }
                          : {})
                      }
                    >
                      {t(label)}
                    </ActionButton>
                  )
                )}
              </ActionButtons>
              <Footer>
                {footerMessage && (
                  <AuthTypography variant="caption">
                    {t(footerMessage)}
                  </AuthTypography>
                )}
              </Footer>
            </Form>
          )}
        </Formik>
      )}
    </AuthContainer>
  );
};

/**
 * A lookup containing only the title strings different from the auth step itself,
 * i.e. `"SMSCode"` step has title `"AuthTitle.EnterCode"` (and is listed in this lookup).
 * If no "special" title, for auth step, specified in this lookup, the title will simply be the same string used to
 * designate the auth step, i.e. `"SignInWithPhone"` will simply be `"AuthTitle.SignInWithPhone"`
 */
const titleLookup = {
  [PhoneAuthStep.EnterSMSCode]: AuthTitle.EnterCode,
};

/**
 * A lookup of input fields rendered for each auth step
 */
const fieldsLookup: AuthTextFieldLookup<PhoneAuthStep> = {
  [PhoneAuthStep.SignInWithPhone]: [
    {
      name: "phone",
      id: "phone",
      label: "Phone",
      type: "tel",
      inputMode: "tel",
    },
  ],
  [PhoneAuthStep.EnterSMSCode]: [
    {
      name: "code",
      id: "code",
      label: "SMS Code",
      type: "text",
      inputMode: "numeric",
    },
  ],
};

/**
 * A lookup of action buttons for each auth step
 */
const actionButtonLookup: ActionButtonLookup<PhoneAuthStep> = {
  [PhoneAuthStep.SignInWithPhone]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Verify,
      variant: "fill",
      type: "submit",
      id: "submit-phone",
    },
  ],
  [PhoneAuthStep.EnterSMSCode]: [
    {
      label: ActionButtonLabel.CodeNotReceived,
      variant: "empty",
      type: "button",
      nextStep: PhoneAuthStep.ResendSMS,
    },
    {
      label: ActionButtonLabel.Submit,
      variant: "fill",
      type: "submit",
    },
  ],
  [PhoneAuthStep.ResendSMS]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Resend,
      variant: "fill",
      type: "submit",
      id: "submit-phone",
    },
  ],
};

/**
 * Footer message for each auth step, if not defined,
 * no message is shown
 */
const footerMessageLookup = {
  [PhoneAuthStep.SignInWithPhone]: AuthMessage.SMSDataRatesMayApply,
};

export default PhoneFlow;
