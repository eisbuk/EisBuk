import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik } from "formik";

import FormSection from "./FormSection";
import { OrganizationLabel } from "@eisbuk/translations";

export default {
  title: "Form Section",
  component: FormSection,
} as ComponentMeta<typeof FormSection>;

const emailFields = [
  {
    name: "emailNameFrom",
    label: OrganizationLabel[OrganizationLabel.EmailNameFrom],
  },
  {
    name: "emailFrom",
    label: OrganizationLabel[OrganizationLabel.EmailFrom],
  },
  {
    name: "emailTemplate",
    label: OrganizationLabel[OrganizationLabel.EmailTemplate],
    multiline: true,
  },
];

const initialValues = { emailNameFrom: "", emailFrom: "", emailTemplate: "" };

export const Default = (): JSX.Element => (
  <Formik {...{ initialValues }} onSubmit={() => {}}>
    <div style={{ width: "50rem", display: "flex", flexDirection: "column" }}>
      <FormSection name="Email" content={emailFields} />
    </div>
  </Formik>
);
