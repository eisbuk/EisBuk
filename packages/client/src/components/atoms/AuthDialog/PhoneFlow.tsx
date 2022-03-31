import React, { useEffect, useState } from "react";
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

import { PhoneAuthStep } from "@/enums/authSteps";

import AuthContainer from "./AuthContainer";
import AuthTypography from "./AuthTypography";
import AuthTextField, { AuthTextFieldLookup } from "./AuthTextField";
import ActionButton, { ActionButtonLookup } from "./ActionButton";
import AuthErrorDialog from "./AuthErrorDialog";

import { isValidPhoneNumber } from "@/utils/helpers";
import useAuthFlow from "@/hooks/useAuthFlow";

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

  const { handleSubmit, dialogError, removeDialogError } =
    useAuthFlow<FullFormValues>({});

  // #region form
  const initialValues = { phone: "", code: "" };

  const validationSchema = yup.object().shape({
    phone: yup
      .string()
      .required(t(ValidationMessage.RequiredField))
      .test({
        test: (input) => isValidPhoneNumber(input),
        message: t(ValidationMessage.InvalidPhone),
      }),
    ...(authStep === PhoneAuthStep.SMSCode
      ? { code: yup.string().required(t(ValidationMessage.RequiredField)) }
      : {}),
  });
  // #endregion form

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "submit-phone",
      {
        size: "invisible",
      },
      getAuth()
    );
  }, []);

  const submitHandlers = {} as Record<PhoneAuthStep, SubmitHandler>;
  submitHandlers[PhoneAuthStep.SignInWithPhone] = async ({ phone }) => {
    const verifier = window;
    await verifier.recaptchaVerifier.verify();
    const res = await signInWithPhoneNumber(
      getAuth(),
      phone,
      window.recaptchaVerifier
    );
    window.confirmationResult = res;
    setAuthStep(PhoneAuthStep.SMSCode);
  };
  submitHandlers[PhoneAuthStep.SMSCode] = async ({ code }) => {
    await window.confirmationResult.confirm(code);
  };

  const title = titleLookup[authStep] || AuthTitle[authStep];

  const footerMessage = footerMessageLookup[authStep];

  return (
    <AuthContainer>
      {({ Header, Content, Footer, ActionButtons }) => (
        <Formik
          onSubmit={handleSubmit(submitHandlers[authStep])}
          {...{ initialValues, validationSchema }}
        >
          {() => (
            <Form>
              <AuthErrorDialog
                open={Boolean(dialogError)}
                message={dialogError || ""}
                onClose={removeDialogError}
              />
              <Header>{t(title)}</Header>
              <Content>
                {fieldsLookup[authStep]?.map((inputProps) => (
                  <AuthTextField {...inputProps} />
                ))}
              </Content>
              <ActionButtons>
                {actionButtonLookup[authStep]?.map(
                  ({ label, ...buttonProps }) => (
                    <ActionButton key={label} {...buttonProps}>
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
  [PhoneAuthStep.SMSCode]: AuthTitle.EnterCode,
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
      type: "text",
      inputMode: "tel",
    },
  ],
  [PhoneAuthStep.SMSCode]: [
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
  [PhoneAuthStep.SMSCode]: [
    {
      label: ActionButtonLabel.Cancel,
      variant: "empty",
      type: "reset",
    },
    {
      label: ActionButtonLabel.Submit,
      variant: "fill",
      type: "submit",
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
