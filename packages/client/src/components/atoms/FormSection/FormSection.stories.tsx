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
    name: "EmailNameFrom",
  },
  {
    name: "EmailFrom",
  },
  {
    name: "EmailTemplate",
    multiline: true,
  },
];

const initialValues = { EmailNameFrom: "", EmailFrom: "", EmailTemplate: "" };

export const Default = (): JSX.Element => (
  <Formik {...{ initialValues }} onSubmit={() => {}}>
    <div style={{ width: "50rem", display: "flex", flexDirection: "column" }}>
      <FormSection name="Email" content={emailFields} />
    </div>
  </Formik>
);
