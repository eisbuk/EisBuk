import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Field, Formik } from "formik";

import Dropdown from "./Dropdown";

export default {
  title: "Forms / Dropdown",
  component: Dropdown,
  decorators: [
    (Story) => (
      <Formik initialValues={{}} onSubmit={() => {}}>
        <Story />
      </Formik>
    ),
  ],
} as ComponentMeta<typeof Dropdown>;

export const Default = (): JSX.Element => (
  <Field
    name="dropdown"
    label="Dropdown"
    component={Dropdown}
    options={["US", "CA", "EU"]}
  />
);
