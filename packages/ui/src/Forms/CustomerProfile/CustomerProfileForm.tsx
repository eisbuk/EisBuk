import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import { Customer } from "@eisbuk/shared";
import i18n, {
  useTranslation,
  ValidationMessage,
  // TODO: add "edit" to ActionButton enums
  ActionButton,
} from "@eisbuk/translations";

import Edit from "./views/Edit";
import Display from "./views/Display";

import { isISODay } from "../../utils/date";
import { isValidPhoneNumber } from "../../utils/helpers";

import Button, { ButtonSize } from "../../Button";

interface FormInputProps {
  customer: Partial<Customer>;
  onCancel?: () => void;
  onSave?: (customer: Customer) => void;
}

const defaultCustomerFormValues = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  birthday: "",
  certificateExpiration: "",
  covidCertificateReleaseDate: "",
  covidCertificateSuspended: false,
};

const CustomerProfileForm: React.FC<FormInputProps> = ({
  customer,
  onCancel = () => {},
  onSave = () => {},
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing(!isEditing);

  const initialValues = {
    ...defaultCustomerFormValues,
    ...customer,
  };

  const handleCancel = () => {
    onCancel();
    toggleEdit();
  };

  return (
    <Formik
      initialValues={customer}
      validationSchema={CustomerValidation}
      onSubmit={(values, { setSubmitting }) => {
        onSave(values as Customer);
        setSubmitting(false);
        toggleEdit();
      }}
    >
      <Form>
        <div className="flex flex-col gap-y-10 justify-between">
          {isEditing ? (
            <>
              <Edit />
              <div className="flex justify-self-end gap-x-2 mt-5">
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="w-24 !text-gray-700 font-medium bg-gray-100 hover:bg-gray-50"
                  size={ButtonSize.LG}
                >
                  {t(ActionButton.Cancel)}
                </Button>
                <Button
                  type="submit"
                  className="w-24 !text-gray-700 bg-green-200 hover:bg-green-100"
                  size={ButtonSize.LG}
                >
                  {t(ActionButton.Save)}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Display customer={initialValues} />
              <div className="flex justify-self-end gap-x-2 mt-5">
                <Button
                  type="button"
                  onClick={toggleEdit}
                  className="w-24 !text-gray-700 font-medium bg-cyan-200 hover:bg-cyan-100"
                  size={ButtonSize.LG}
                >
                  Edit
                </Button>
              </div>
            </>
          )}
        </div>
      </Form>
    </Formik>
  );
};

const CustomerValidation = Yup.object().shape({
  name: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  surname: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  email: Yup.string().email(i18n.t(ValidationMessage.Email)),
  phone: Yup.string().test({
    test: (input) => !input || isValidPhoneNumber(input),
    message: i18n.t(ValidationMessage.InvalidPhone),
  }),
  birthday: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
  certificateExpiration: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
  covidCertificateReleaseDate: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: i18n.t(ValidationMessage.InvalidDate),
  }),
  covidCertificateSuspended: Yup.boolean(),
  category: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  subscriptionNumber: Yup.number(),
});

export default CustomerProfileForm;
