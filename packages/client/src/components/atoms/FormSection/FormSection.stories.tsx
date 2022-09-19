import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik } from "formik";

import i18n, { OrganizationLabel } from "@eisbuk/translations";
import { CountryCodesDropdownFormik } from "@eisbuk/ui";

import FormSection from "./FormSection";

export default {
  title: "Form Section",
  component: FormSection,
} as ComponentMeta<typeof FormSection>;

const generalFields = [
  {
    name: "displayName",
    label: i18n.t(OrganizationLabel.DisplayName),
  },
  {
    name: "loaction",
    label: i18n.t(OrganizationLabel.Location),
  },
  {
    name: "defaultCountryCode",
    label: i18n.t(OrganizationLabel.CountryCode),
    component: CountryCodesDropdownFormik,
  },
];

const emailFields = [
  {
    name: "emailNameFrom",
    label: i18n.t(OrganizationLabel.EmailNameFrom),
  },
  {
    name: "emailFrom",
    label: i18n.t(OrganizationLabel.EmailFrom),
  },
  {
    name: "emailTemplate",
    label: i18n.t(OrganizationLabel.EmailTemplate),
    multiline: true,
    rows: 6,
  },
];

const smsFields = [
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

const initialValues = {};

export const Default = (): JSX.Element => (
  <Formik {...{ initialValues }} onSubmit={() => {}}>
    <div className="w-lg">
      <FormSection title="General" content={generalFields} />
      <FormSection title="Email" content={emailFields} />
      <FormSection title="SMS" content={smsFields} />
    </div>
  </Formik>
);
