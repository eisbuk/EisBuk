import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Field, Formik } from "formik";

import PhoneInput from "./PhoneInput";

export default {
  title: "Phone Input",
  component: PhoneInput,
  decorators: [
    (Story) => (
      <Formik initialValues={{}} onSubmit={() => {}}>
        <div className="w-[360px]">
          <Story />
        </div>
      </Formik>
    ),
  ],
} as ComponentMeta<typeof PhoneInput>;

export const Default = (): JSX.Element => (
  <Field
    name="phone"
    label="Phone"
    placeholder="Phone"
    component={PhoneInput}
  />
);
