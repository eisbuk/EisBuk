import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik, Form, Field } from "formik";

import Checkbox from "./";

export default {
  title: "Forms / Checkbox",
  component: Checkbox,
} as ComponentMeta<typeof Checkbox>;

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <div className="flex flex-col w-72 space-y-5">
      <Formik
        initialValues={{
          default: "",
          checked: true,
          disabled: true,
        }}
        onSubmit={() => {}}
      >
        <Form className="flex flex-col w-72 space-y-5">
          <Field
            name="default"
            type="checkbox"
            component={Checkbox}
            label="Select an option?"
            helpText="Unchecked & focussable"
          />
          <Field
            name="checked"
            type="checkbox"
            component={Checkbox}
            label="Select an option?"
            helpText="Option checked"
          />
          <Field
            name="disabled"
            type="checkbox"
            component={Checkbox}
            label="Select an option?"
            helpText="Unchecked & focussable"
            disabled={true}
          />
        </Form>
      </Formik>
    </div>
  </>
);
