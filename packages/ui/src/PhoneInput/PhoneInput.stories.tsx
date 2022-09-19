import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Field, Formik } from "formik";

import PhoneInput from "./PhoneInput";

export default {
  title: "Phone Input",
  component: PhoneInput,
} as ComponentMeta<typeof PhoneInput>;

export const Default = (): JSX.Element => (
  <Formik
    initialValues={{}}
    initialErrors={{ phoneError: "This is an error" }}
    initialTouched={{ phoneError: true }}
    onSubmit={() => {}}
  >
    <div className="w-[360px]">
      <Field
        name="phone"
        label="Phone"
        placeholder="Phone"
        component={PhoneInput}
      />
      <Field
        name="phoneError"
        label="Phone with error"
        placeholder="Phone"
        component={PhoneInput}
      />
    </div>
  </Formik>
);
