import React, { useState } from "react";
import { Formik, Field, FieldProps } from "formik";
import * as Yup from "yup";

import { Customer } from "@eisbuk/shared";
import i18n, {
  useTranslation,
  ValidationMessage,
  CustomerLabel,
  ActionButton,
} from "@eisbuk/translations";
import {
  User,
  Cake,
  Mail,
  Phone,
  ClipboardList,
  ShieldCheck,
} from "@eisbuk/svg";

import Button, { ButtonSize } from "../../Button";
import TextInput, { IconAdornment } from "../../TextInput";
import DateInput from "../../DateInput";
import Checkbox from "../../Checkbox";

import { isISODay } from "../../utils/date";
import { isValidPhoneNumber } from "../../utils/helpers";

interface FormProps {
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

const CustomerProfileForm: React.FC<FormProps> = ({
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

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={CustomerValidation}
      onSubmit={(values, { setSubmitting }) => {
        onSave(values as Customer);
        setSubmitting(false);
        toggleEdit();
      }}
    >
      {({ resetForm, handleSubmit, isSubmitting }) => (
        <form onSubmit={handleSubmit}>
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
                          <IconAdornment
                            Icon={<User />}
                            position="start"
                            disabled={!isEditing}
                          />
                        }
                        disabled={!isEditing}
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
                          <IconAdornment
                            Icon={<User />}
                            position="start"
                            disabled={!isEditing}
                          />
                        }
                        disabled={!isEditing}
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
                          <IconAdornment
                            Icon={<Cake />}
                            position="start"
                            disabled={!isEditing}
                          />
                        }
                        disabled={!isEditing}
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
                          <IconAdornment
                            Icon={<Mail />}
                            position="start"
                            disabled={!isEditing}
                          />
                        }
                        disabled={!isEditing}
                      />
                    )}
                  </Field>
                </div>
                <div className="col-span-3">
                  <Field name="phone">
                    {({ field, meta, form }: FieldProps) => (
                      <TextInput
                        formikField={{ field, meta, form }}
                        label={t(CustomerLabel.Phone)}
                        StartAdornment={
                          <IconAdornment
                            Icon={<Phone />}
                            position="start"
                            disabled={!isEditing}
                          />
                        }
                        onBlur={(e) =>
                          form.setFieldValue(
                            "phone",
                            e.target.value.replace(/\s/g, "")
                          )
                        }
                        disabled={!isEditing}
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
                          <IconAdornment
                            Icon={<ClipboardList />}
                            position="start"
                            disabled={!isEditing}
                          />
                        }
                        disabled={!isEditing}
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
                          <IconAdornment
                            Icon={<ShieldCheck />}
                            position="start"
                            disabled={!isEditing}
                          />
                        }
                        disabled={!isEditing}
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
                        disabled={!isEditing}
                      />
                    )}
                  </Field>
                </div>
              </div>
            </Section>

            {isEditing ? (
              <>
                <div className="flex justify-self-end gap-x-2 mt-5">
                  <Button
                    type="reset"
                    onClick={() => {
                      onCancel();
                      resetForm();
                      toggleEdit();
                    }}
                    className="w-24 !text-gray-700 font-medium bg-gray-100 hover:bg-gray-50"
                    size={ButtonSize.LG}
                  >
                    {t(ActionButton.Cancel)}
                  </Button>
                  <Button
                    type="submit"
                    className="w-24 !text-gray-700 bg-green-200 hover:bg-green-100"
                    size={ButtonSize.LG}
                    disabled={isSubmitting}
                  >
                    {t(ActionButton.Save)}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-self-end gap-x-2 mt-5">
                  <Button
                    type="button"
                    onClick={toggleEdit}
                    className="w-24 !text-gray-700 font-medium bg-cyan-200 hover:bg-cyan-100"
                    size={ButtonSize.LG}
                  >
                    {t(ActionButton.Edit)}
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>
      )}
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

const Section: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
  children,
}) => (
  <div className="md:grid md:grid-cols-3 md:gap-6">
    <div className="md:col-span-1">
      <h2 className="text-lg text-cyan-700 font-medium">{title}</h2>
      <p className="text-sm text-gray-500 font-normal">{subtitle}</p>
    </div>
    <div className="mt-5 space-y-6 md:mt-0 md:col-span-2">{children}</div>
  </div>
);

export default CustomerProfileForm;
