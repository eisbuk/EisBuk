import React from "react";
import i18n, { OrganizationLabel } from "@eisbuk/translations";
import { CountryCodesDropdownFormik } from "@eisbuk/ui";

import FormSection, {
  FormSectionFieldProps,
} from "@/components/atoms/FormSection";

const GeneralSettings: React.FC = () => {
  return (
    <>
      <FormSection content={generalFields} title="General" />
      <FormSection content={emailFields} title="Email" />
      <FormSection content={smsFields} title="SMS" />
    </>
  );
};

// #region fieldSetup
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
