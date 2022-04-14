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
  },
  {
    name: "emailFrom",
  },
  {
    name: "emailTemplate",
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
