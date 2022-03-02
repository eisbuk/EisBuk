import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik } from "formik";

import FormSection from "./FormSection";

export default {
  title: "Form Section",
  component: FormSection,
} as ComponentMeta<typeof FormSection>;

const emailFields = [
  {
    name: "emailNameFrom",
    label: "Email Name From",
  },
  {
    name: "emailFrom",
    label: "Email From",
  },
  {
    name: "emailTemplate",
    label: "Email Template",
    multiline: true,
  },
];

const initialValues = { emailNameFrom: "", emailFrom: "", emailTemplate: "" };

export const Default = (): JSX.Element => (
  <Formik {...{ initialValues }} onSubmit={() => {}}>
    <div style={{ width: "50rem", display: "flex", flexDirection: "column" }}>
      <FormSection name="email" content={emailFields} />
    </div>
  </Formik>
);
