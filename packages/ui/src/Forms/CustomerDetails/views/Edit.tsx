import React from "react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";

import { Customer } from "@eisbuk/shared";
import i18n, {
  useTranslation,
  CustomerLabel,
  ValidationMessage,
  ActionButton,
} from "@eisbuk/translations";
import {
  User,
  Cake,
  Mail,
  Phone,
  ClipboardList,
  SheildCheck,
} from "@eisbuk/svg";

import TextInput, { IconAdornment } from "../../../TextInput";
import DateInput from "../../../DateInput";
import Checkbox from "../../../Checkbox";
import Button, { ButtonSize } from "../../../Button";

import Section from "./Section";

import { isISODay } from "../../../utils/date";
import { isValidPhoneNumber } from "../../../utils/helpers";

export interface FormInputProps {
  customer: Partial<Customer>;
  onCancel?: () => void;
  onSave?: (customer: Customer) => void;
}

const CustomerDetailsForm: React.FC<FormInputProps> = ({
  customer,
  onCancel = () => {},
  onSave = () => {},
}) => {
  const { t } = useTranslation();

  return (
    <Formik
      initialValues={customer}
      validationSchema={CustomerValidation}
      onSubmit={(values, { setSubmitting }) => {
        onSave(values as Customer);
        setSubmitting(false);
      }}
    >
      <Form>
        <div className="flex flex-col gap-y-10 justify-between">
          <Section
            title="Personal Details"
            subtitle="Manage your personal details"
          >
            <div className="sm:grid sm:grid-cols-6 gap-x-6 gap-y-2 md:border-b-2 md:border-gray-100">
              <div className="col-span-3">
                <Field name="name">
                  {(field: FieldProps) => (
                    <TextInput
                      formikField={field}
                      label={t(CustomerLabel.Name)}
                      StartAdornment={
                        <IconAdornment Icon={User} position="start" />
                      }
                    />
                  )}
                </Field>
              </div>
              <div className="col-span-3">
                <Field name="surname">
                  {(field: FieldProps) => (
                    <TextInput
                      formikField={field}
                      label={t(CustomerLabel.Surname)}
                      StartAdornment={
                        <IconAdornment Icon={User} position="start" />
                      }
                    />
                  )}
                </Field>
              </div>
              <div className="col-span-4">
                <Field name="birthday">
                  {(field: FieldProps) => (
                    <DateInput
                      formikField={field}
                      label={t(CustomerLabel.Birthday)}
                      StartAdornment={
                        <IconAdornment Icon={Cake} position="start" />
                      }
                    />
                  )}
                </Field>
              </div>
              <div className="col-span-3">
                <Field name="email">
                  {(field: FieldProps) => (
                    <TextInput
                      formikField={field}
                      label={t(CustomerLabel.Email)}
                      StartAdornment={
                        <IconAdornment Icon={Mail} position="start" />
                      }
                    />
                  )}
                </Field>
              </div>
              <div className="col-span-3">
                <Field name="phone">
                  {(field: FieldProps) => (
                    <TextInput
                      formikField={field}
                      label={t(CustomerLabel.Phone)}
                      StartAdornment={
                        <IconAdornment Icon={Phone} position="start" />
                      }
                    />
                  )}
                </Field>
              </div>
            </div>
          </Section>

          <Section
            title="Medical Details"
            subtitle="Manage your medical details"
          >
            <div className="grid sm:grid-cols-6 gap-y-2">
              <div className="col-span-4">
                <Field name="certificateExpiration">
                  {(field: FieldProps) => (
                    <DateInput
                      formikField={field}
                      label={t(CustomerLabel.CertificateExpiration)}
                      StartAdornment={
                        <IconAdornment Icon={ClipboardList} position="start" />
                      }
                    />
                  )}
                </Field>
              </div>
              <div className="col-span-4">
                <Field name="covidCertificateReleaseDate">
                  {(field: FieldProps) => (
                    <DateInput
                      formikField={field}
                      label={t(CustomerLabel.CovidCertificateReleaseDate)}
                      StartAdornment={
                        <IconAdornment Icon={SheildCheck} position="start" />
                      }
                    />
                  )}
                </Field>
              </div>
              <div className="col-span-4">
                <Field name="covidCertificateSuspended" type="checkbox">
                  {(field: FieldProps) => (
                    <Checkbox
                      formikField={field}
                      label={t(CustomerLabel.CovidCertificateSuspended)}
                      helpText="Check this box if your COVID certificate is more than 9 months old"
                    />
                  )}
                </Field>
              </div>
            </div>
          </Section>

          <div className="flex justify-self-end gap-x-2 mt-5">
            <Button
              onClick={onCancel}
              className="w-24 !text-gray-700 font-medium bg-gray-100 hover:bg-gray-50"
              size={ButtonSize.LG}
            >
              {t(ActionButton.Cancel)}
            </Button>
            <Button
              className="w-24 !text-gray-700 bg-green-200 hover:bg-green-100"
              size={ButtonSize.LG}
            >
              {t(ActionButton.Save)}
            </Button>
          </div>
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
    message: ValidationMessage.InvalidDate,
  }),
  certificateExpiration: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: ValidationMessage.InvalidDate,
  }),
  covidCertificateReleaseDate: Yup.string().test({
    test: (input) => !input || isISODay(input),
    message: ValidationMessage.InvalidDate,
  }),
  covidCertificateSuspended: Yup.boolean(),
  category: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
  subscriptionNumber: Yup.number(),
});

export default CustomerDetailsForm;
