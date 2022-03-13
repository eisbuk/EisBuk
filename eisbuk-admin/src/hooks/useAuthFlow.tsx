import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormikConfig } from "formik";

import { AuthErrorCodes, AuthError } from "@firebase/auth";

import { AuthErrorMessage } from "@/enums/translations";

type ErrorCodeKey = keyof typeof AuthErrorCodes;
type ErrorCode = typeof AuthErrorCodes[ErrorCodeKey];

/**
 * Firebase auth error codes mapped to a field name for which the error should be set
 *
 * @example
 * ```
 * {
 *  "auth/wrong-password": "password"
 * }
 * ```
 * if `auth/wrong-password` encountered, set error for field `"password"`
 */
export type FieldErrorMap = Partial<Record<ErrorCode, string>>;

type OnSubmit<V extends Record<string, any>> = FormikConfig<V>["onSubmit"];

interface HandleSubmit<V extends Record<string, any>> {
  (fn: OnSubmit<V>): OnSubmit<V>;
}

interface UseAuthFlow {
  <V extends Record<string, any>>(fieldErrorMap: FieldErrorMap): {
    dialogError: string | null;
    removeDialogError: () => void;
    handleSubmit: HandleSubmit<V>;
  };
}

/**
 * A hook used to handle firebase auth requests and possible errors.
 * Receives a `fieldErrorMap` used to differenciate between errors displayed as
 * vield validation (handled in `fieldErrorMap`) and errors displayed as error dialog.
 *
 * Keeps internal state of error message in dialog.
 *
 * Returns `dialogError`, `removeDialogError` (a handler to be fired on error dialog close)
 * and `handleSubmit` (A wrapper around auth request with error boundry and error handling logic)
 */
const useAuthFlow: UseAuthFlow = (fieldErrorMap) => {
  const { t } = useTranslation();
  const [dialogError, setDialogError] = useState<string | null>(null);

  /**
   * Sets `null` as dialog error.
   * Should be fired on error dialog close
   */
  const removeDialogError = () => setDialogError(null);

  /**
   * A wrapper around formik submit handler. Used to fire the
   * auth reuqest within an error boundary and handle the would-be errors
   * according to the rest of the hook flow.
   * @param authRequest a request to be sent for auth step (in form of Formik `onSubmit` handler)
   * @returns the aforementioned handler with error boundary
   */
  const handleSubmit: HandleSubmit<any> =
    (authRequest) =>
    async (...params) => {
      const [, { setFieldError }] = params;

      try {
        await authRequest(...params);
      } catch (err) {
        const error = err as AuthError;
        // a translated string-format error message
        const errorMessage =
          // if error message not defined for a particular error code, fall back to unknown error
          t(AuthErrorMessage[error.code] || AuthErrorMessage.UNKNOWN);

        console.log("Error code", error.code);

        // check if the error message should be set as a field error or dialog
        const invalidField = fieldErrorMap[error.code] as string | undefined;
        if (invalidField) {
          setFieldError(invalidField, errorMessage);
        } else {
          setDialogError(errorMessage);
        }
      }
    };

  return { dialogError, removeDialogError, handleSubmit };
};

export default useAuthFlow;
