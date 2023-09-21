import React from "react";
import { Field, FieldProps } from "formik";
import { QuestionMarkCircle } from "@eisbuk/svg";

import i18n, { OrganizationLabel } from "@eisbuk/translations";
import {
  CountryCodesDropdownFormik,
  FormSection,
  HoverText,
  TextInput,
} from "@eisbuk/ui";

const HelpText: React.FC<{ text?: string }> = ({ text }) =>
  text ? (
    <HoverText
      multiline="md"
      className="h-5 w-5 ml-2.5 text-gray-700"
      text={text}
    >
      <QuestionMarkCircle />
    </HoverText>
  ) : null;

const GeneralSettings: React.FC = () => {
  return (
    <>
      <FormSection title="General">
        {generalFields.map(
          ({ component = TextInput, description, ...field }) => (
            <Field
              key={field.name}
              component={component}
              {...field}
              StartAdornment={<HelpText text={description || ""} />}
            />
          )
        )}
      </FormSection>
      <FormSection title="Email">
        {emailFields.map(({ component = TextInput, description, ...field }) => (
          <Field
            key={field.name}
            component={component}
            {...field}
            StartAdornment={<HelpText text={description || ""} />}
          />
        ))}
      </FormSection>
      <FormSection title="SMS">
        {smsFields.map(({ component = TextInput, description, ...field }) => (
          <Field
            key={field.name}
            component={component}
            {...field}
            StartAdornment={<HelpText text={description || ""} />}
          />
        ))}
      </FormSection>
    </>
  );
};

// #region fieldSetup
interface FormSectionFieldProps {
  name: string;
  description?: string;
  label: string;
  multiline?: boolean;
  rows?: number;
  component?: React.FC<Pick<FieldProps, "field">>;
}

const generalFields: FormSectionFieldProps[] = [
  {
    name: "displayName",
    label: i18n.t(OrganizationLabel.DisplayName),
    description: i18n.t(OrganizationLabel.DisplayNameHelpText),
  },
  {
    name: "location",
    label: i18n.t(OrganizationLabel.Location),
    description: i18n.t(OrganizationLabel.LocationHelpText),
  },
  {
    name: "registrationCode",
    label: i18n.t(OrganizationLabel.RegistrationCode),
    description: i18n.t(OrganizationLabel.RegistrationCodeHelpText),
  },
  {
    name: "defaultCountryCode",
    label: i18n.t(OrganizationLabel.CountryCode),
    description: i18n.t(OrganizationLabel.CountryCodeHelpText),
    component: CountryCodesDropdownFormik,
  },
];
const emailFields: FormSectionFieldProps[] = [
  {
    name: "emailNameFrom",
    label: i18n.t(OrganizationLabel.EmailNameFrom),
    description: i18n.t(OrganizationLabel.EmailNameFromHelpText),
  },
  {
    name: "emailFrom",
    label: i18n.t(OrganizationLabel.EmailFrom),
    description: i18n.t(OrganizationLabel.EmailFromHelpText),
  },
  {
    name: "bcc",
    label: i18n.t(OrganizationLabel.BCC),
    description: i18n.t(OrganizationLabel.BCCHelpText),
  },
];
const smsFields: FormSectionFieldProps[] = [
  {
    name: "smsFrom",
    label: i18n.t(OrganizationLabel.SmsFrom),
    description: i18n.t(OrganizationLabel.SmsFromHelpText),
  },
  {
    name: "smsTemplate",
    label: i18n.t(OrganizationLabel.SmsTemplate),
    description: i18n.t(OrganizationLabel.SmsTemplateHelpText),
    multiline: true,
    rows: 6,
  },
];
// #endregion fieldSetup

export default GeneralSettings;
