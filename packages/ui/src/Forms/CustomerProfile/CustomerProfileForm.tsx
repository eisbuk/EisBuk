import React, { useState, FocusEvent, useMemo } from "react";
import { Formik, Field, Form, FormikConfig } from "formik";
import * as Yup from "yup";

import { CustomerBase } from "@eisbuk/shared";
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

export enum CustomerFormVariant {
  Default = "default",
  SelfRegistration = "self-registration",
}

type DefaultFormProps = {
  customer: CustomerBase;
  onCancel?: () => void;
  variant?: CustomerFormVariant.Default;
  onSave?: (customer: CustomerBase) => void;
};
type SelfRegFormProps = {
  customer: Pick<CustomerBase, "email">;
  onCancel?: () => void;
  variant: CustomerFormVariant.SelfRegistration;
  onSave?: FormikConfig<
    CustomerBase & { registrationCode: string }
  >["onSubmit"];
};

const defaultCustomerFormValues: CustomerBase = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  birthday: "",
  certificateExpiration: "",
  covidCertificateReleaseDate: "",
  covidCertificateSuspended: false,
};

const CustomerProfileForm = <P extends DefaultFormProps | SelfRegFormProps>({
  customer = {},
  variant = CustomerFormVariant.Default,
  onCancel = () => {},
  onSave = () => {},
}: P): JSX.Element => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(
    variant === CustomerFormVariant.SelfRegistration
  );

  const toggleEdit = () => {
    setIsEditing((isEditing) => !isEditing);
  };

  const initialValues = {
    ...defaultCustomerFormValues,
    ...customer,
    // In case of variant === "default" this is a no-op
    registrationCode: "",
  };

  const validationSchema = useMemo(
    () => getValidationSchema(variant),
    [variant]
  );

  return (
    <Formik
      enableReinitialize
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={async (values, helpers) => {
        await onSave(values, helpers);
        helpers.setSubmitting(false);

        if (variant === CustomerFormVariant.Default) {
          toggleEdit();
        }
      }}
    >
      {({ isSubmitting, setFieldValue, resetForm }) => (
        <Form>
          <div className="flex flex-col gap-y-10 justify-between">
            <Section
              title={t(CustomerLabel.PersonalDetails)}
              subtitle={t(CustomerLabel.ManagePersonalDetails)}
            >
              <div className="sm:grid sm:grid-cols-6 gap-x-6 gap-y-2 md:border-b-2 md:border-gray-100">
                <div className="col-span-3">
                  <Field
                    component={TextInput}
                    name="name"
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
                </div>
                <div className="col-span-3">
                  <Field
                    component={TextInput}
                    name="surname"
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
                </div>
                <div className="col-span-4">
                  <Field
                    component={DateInput}
                    name="birthday"
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
                </div>
                <div className="col-span-3">
                  <Field
                    component={TextInput}
                    name="email"
                    label={t(CustomerLabel.Email)}
                    StartAdornment={
                      <IconAdornment
                        Icon={<Mail />}
                        position="start"
                        disabled={!isEditing}
                      />
                    }
                    disabled={
                      !isEditing ||
                      // When self registrating, email should be pre-filled and not changed
                      variant === CustomerFormVariant.SelfRegistration
                    }
                  />
                </div>
                <div className="col-span-3">
                  <Field
                    component={TextInput}
                    name="phone"
                    label={t(CustomerLabel.Phone)}
                    StartAdornment={
                      <IconAdornment
                        Icon={<Phone />}
                        position="start"
                        disabled={!isEditing}
                      />
                    }
                    onBlur={(e: FocusEvent<HTMLInputElement>) =>
                      setFieldValue("phone", e.target.value.replace(/\s/g, ""))
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </Section>

            <Section
              title={t(CustomerLabel.MedicalDetails)}
              subtitle={t(CustomerLabel.ManageMedicalDetails)}
            >
              <div className="grid sm:grid-cols-6 gap-y-2">
                <div className="col-span-4">
                  <Field
                    component={DateInput}
                    name="certificateExpiration"
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
                </div>
                <div className="col-span-4">
                  <Field
                    component={DateInput}
                    name="covidCertificateReleaseDate"
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
                </div>
                <div className="col-span-4">
                  <Field
                    name="covidCertificateSuspended"
                    type="checkbox"
                    component={Checkbox}
                    label={t(CustomerLabel.CovidCertificateSuspended)}
                    helpText="Check this box if your COVID certificate is more than 9 months old"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </Section>

            {variant === CustomerFormVariant.SelfRegistration && (
              <Section
                title={t(CustomerLabel.RegistrationCode)}
                subtitle={t(CustomerLabel.InputRegistrationCode)}
              >
                <div className="grid sm:grid-cols-6 gap-y-2">
                  <div className="col-span-4">
                    <Field
                      component={TextInput}
                      name="registrationCode"
                      label={t(CustomerLabel.RegistrationCode)}
                    />
                  </div>
                </div>
              </Section>
            )}

            {isEditing ? (
              <>
                <div className="flex justify-self-end gap-x-2 mt-5">
                  <Button
                    type="reset"
                    onClick={() => {
                      resetForm();
                      onCancel();
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
                    className="!text-gray-700 font-medium bg-cyan-200 hover:bg-cyan-100"
                    size={ButtonSize.LG}
                  >
                    {t(ActionButton.Edit)}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
};

const getValidationSchema = (variant: CustomerFormVariant) =>
  Yup.object().shape({
    name: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
    surname: Yup.string().required(i18n.t(ValidationMessage.RequiredField)),
    email: Yup.string().email(i18n.t(ValidationMessage.Email)),
    phone: Yup.string().test({
      test: (input) => !input || isValidPhoneNumber(input),
      message: i18n.t(ValidationMessage.InvalidPhone),
    }),
    birthday: Yup.string()
      .required(i18n.t(ValidationMessage.RequiredField))
      .test({
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
    subscriptionNumber: Yup.number(),

    // Add validations for additional fields for self registration variant
    ...(variant === CustomerFormVariant.SelfRegistration
      ? {
          registrationCode: Yup.string().required(
            i18n.t(ValidationMessage.RequiredField)
          ),
        }
      : {}),
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
