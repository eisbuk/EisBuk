import React from "react";
import { useDispatch } from "react-redux";
import { Field, Formik } from "formik";
import * as Yup from "yup";

import { ActionDialog, TextInput } from "@eisbuk/ui";
import i18n, {
  ActionButton,
  Prompt,
  useTranslation,
  ValidationMessage,
} from "@eisbuk/translations";
import { Customer } from "@eisbuk/shared";

import { testId } from "@eisbuk/testing/testIds";

import { BaseModalProps } from "../../types";

import { sendBookingsCalendar } from "@/store/actions/icsCalendarOperations";

type SendICSDialogProps = BaseModalProps &
  Pick<Customer, "secretKey" | "email">;

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .required(i18n.t(ValidationMessage.RequiredEntry))
    .email(i18n.t(ValidationMessage.Email)),
});

const SendICSDialog: React.FC<SendICSDialogProps> = ({
  secretKey,
  email = "",
  onClose,
}) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const handleConfirm = (email: string) => {
    dispatch(sendBookingsCalendar(secretKey, email));
    onClose();
  };

  return (
    <Formik
      initialValues={{ email }}
      onSubmit={({ email }) => handleConfirm(email)}
      validationSchema={validationSchema}
    >
      {({ submitForm }) => (
        <ActionDialog
          title={t(Prompt.EnterEmailTitle)}
          cancelLabel={t(ActionButton.Cancel)}
          confirmLabel={t(ActionButton.Send)}
          onCancel={onClose}
          onConfirm={submitForm}
        >
          <p className="mb-6 w-[90%]">{t(Prompt.EnterEmailMessage)}</p>
          <Field
            name="email"
            type="email"
            data-testid={testId("input-dialog-email-input")}
            component={TextInput}
          />
        </ActionDialog>
      )}
    </Formik>
  );
};

export default SendICSDialog;
