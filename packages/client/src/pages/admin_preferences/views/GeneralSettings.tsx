import React from "react";
import { Field, FieldProps } from "formik";

import i18n, { OrganizationLabel } from "@eisbuk/translations";
import { CountryCodesDropdownFormik, FormSection, TextInput } from "@eisbuk/ui";

const GeneralSettings: React.FC = () => {
  return (
    <>
      <FormSection title="General">
        {generalFields.map(({ component = TextInput, ...field }) => (
          <Field key={field.name} component={component} {...field} />
        ))}
      </FormSection>
      <FormSection title="Email">
        {emailFields.map(({ component = TextInput, ...field }) => (
          <Field key={field.name} component={component} {...field} />
        ))}
      </FormSection>
      <FormSection title="SMS">
        {smsFields.map(({ component = TextInput, ...field }) => (
          <Field key={field.name} component={component} {...field} />
        ))}
      </FormSection>
    </>
  );
};

// #region fieldSetup
interface FormSectionFieldProps {
  name: string;
  label: string;
  multiline?: boolean;
  rows?: number;
  component?: React.FC<Pick<FieldProps, "field">>;
}

const generalFields: FormSectionFieldProps[] = [
  {
    name: "displayName",
    label: i18n.t(OrganizationLabel.DisplayName),
  },
  {
    name: "location",
    label: i18n.t(OrganizationLabel.Location),
  },
  {
    name: "registrationCode",
    label: i18n.t(OrganizationLabel.RegistrationCode),
  },
  {
    name: "defaultCountryCode",
    label: i18n.t(OrganizationLabel.CountryCode),
    component: CountryCodesDropdownFormik,
  },
];
const emailFields: FormSectionFieldProps[] = [
  {
    name: "emailNameFrom",
    label: i18n.t(OrganizationLabel.EmailNameFrom),
  },
  {
    name: "emailFrom",
    label: i18n.t(OrganizationLabel.EmailFrom),
  },
  {
    name: "bcc",
    label: i18n.t(OrganizationLabel.BCC),
  },
];
const smsFields: FormSectionFieldProps[] = [
  {
    name: "smsFrom",
    label: i18n.t(OrganizationLabel.SmsFrom),
  },
  {
    name: "smsTemplate",
    label: i18n.t(OrganizationLabel.SmsTemplate),
    multiline: true,
    rows: 6,
  },
];
// #endregion fieldSetup

export default GeneralSettings;
