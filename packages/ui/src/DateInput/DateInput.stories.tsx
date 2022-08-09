import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik, Form, Field } from "formik";

import DateInput from ".";

export default {
  title: "Forms / DateInput",
  component: DateInput,
} as ComponentMeta<typeof DateInput>;

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <div className="flex flex-col w-72 space-y-5">
      <Formik
        initialValues={{
          default: "",
          withError: "",
        }}
        initialErrors={{
          withError: "This is erroneous",
        }}
        initialTouched={{
          withError: true,
        }}
        onSubmit={() => {}}
      >
        <Form>
          <Field name="default" label="Default" component={DateInput} />
          <Field name="withError" label="With Error" component={DateInput} />
        </Form>
      </Formik>
    </div>
  </>
);
