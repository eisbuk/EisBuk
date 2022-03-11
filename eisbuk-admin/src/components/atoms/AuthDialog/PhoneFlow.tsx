import React, { useEffect, useState } from "react";
import { Formik, Form, FormikConfig } from "formik";
import {
  getAuth,
  RecaptchaVerifier,
  ConfirmationResult,
  signInWithPhoneNumber,
} from "@firebase/auth";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import {
  AuthMessage,
  AuthTitle,
  ValidationMessage,
} from "@/enums/translations";

import AuthContainer from "./AuthContainer";
import AuthTextField from "./AuthTextField";
import AuthTypography from "./AuthTypography";
import ActionButton from "./ActionButton";

import { isValidPhoneNumber } from "@/utils/helpers";
import useAuthFlow from "@/hooks/useAuthFlow";
import AuthErrorDialog from "./AuthErrorDialog";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

enum PhoneAuthStep {
  PhoneInput = "phone-input",
  SMSCode = "sms-code",
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

  const [authStep, setAuthStep] = useState(PhoneAuthStep.PhoneInput);

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
  submitHandlers[PhoneAuthStep.PhoneInput] = async ({ phone }) => {
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

  const footerMessage =
    authStep === PhoneAuthStep.PhoneInput
      ? t(AuthMessage.SMSDataRatesMayApply)
      : undefined;

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
              <Header>{t(titleLookup[authStep])}</Header>
              <Content>
                <AuthTextField {...inputFieldLookup[authStep]} />
              </Content>
              <ActionButtons>
                <ActionButton
                  id={buttonIdLookup[authStep]}
                  variant="fill"
                  type="submit"
                >
                  {buttonLabelLookup[authStep]}
                </ActionButton>
              </ActionButtons>
              <Footer>
                {footerMessage && (
                  <AuthTypography variant="caption">
                    {footerMessage}
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

const buttonIdLookup = {
  [PhoneAuthStep.PhoneInput]: "submit-phone",
  [PhoneAuthStep.SMSCode]: "submit-code",
};

const titleLookup = {
  [PhoneAuthStep.PhoneInput]: AuthTitle.SignInWithPhone,
  [PhoneAuthStep.SMSCode]: AuthTitle.EnterCode,
};
const buttonLabelLookup = {
  [PhoneAuthStep.PhoneInput]: "Verify",
  [PhoneAuthStep.SMSCode]: "Submit",
};
const inputFieldLookup = {
  [PhoneAuthStep.PhoneInput]: {
    name: "phone",
    id: "phone",
    label: "Phone",
    type: "phone",
  },
  [PhoneAuthStep.SMSCode]: {
    name: "code",
    id: "code",
    label: "SMS Code",
    type: "text",
  },
};

export default PhoneFlow;
