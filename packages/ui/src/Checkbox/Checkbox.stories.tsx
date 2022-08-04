import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik, Form, Field, FieldProps } from "formik";

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
          <Field name="default" type="checkbox">
            {(field: FieldProps) => (
              <Checkbox
                formikField={field}
                label="Select an option?"
                helpText="Unchecked & focssuable"
              />
            )}
          </Field>

          <Field name="checked" type="checkbox">
            {(field: FieldProps) => (
              <Checkbox
                formikField={field}
                label="Select an option?"
                helpText="Option checked"
              />
            )}
          </Field>
          <Field name="disabled" type="checkbox">
            {(field: FieldProps) => (
              <Checkbox
                formikField={field}
                label="Select an option?"
                helpText="Option checked - readonly"
                disabled={true}
              />
            )}
          </Field>
        </Form>
      </Formik>
    </div>
  </>
);
