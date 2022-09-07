import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";

import { Calendar } from "@eisbuk/svg";

import TextInput, { IconAdornment, AddOnAdornment, ButtonAdornment } from ".";
import Dropdown from "../Dropdown";

export default {
  title: "Forms / TextInput",
  component: TextInput,
} as ComponentMeta<typeof TextInput>;

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <Formik
      initialValues={{
        default: "",
        withError: "",
        disabled: "",
      }}
      initialErrors={{
        withError: "This is erroneous",
      }}
      validationSchema={yup.object().shape({
        withError: yup
          .string()
          .test({ message: "This is erroneous", test: () => false }),
      })}
      initialTouched={{
        withError: true,
      }}
      onSubmit={() => {}}
    >
      <Form className="flex flex-col w-72 space-y-5">
        <Field
          name="default"
          label="Email"
          component={TextInput}
          placeholder="chris@myriad.co"
          helpText="We'll only use this for spam."
        />
        <Field
          name="withError"
          label="Email"
          component={TextInput}
          placeholder="invalid@email.co"
          helpText="We'll only use this for spam."
        />
        <Field
          name="disabled"
          label="Email"
          component={TextInput}
          placeholder="disabled@myriad.co"
          helpText="We'll only use this for spam."
        />
      </Form>
    </Formik>
    <h1 className="text-lg font-bold mb-4">Adornments</h1>
    <Formik
      initialValues={{
        icon: "",
        addOn: "",
        dropdown: "",
        button: "",
      }}
      onSubmit={() => {}}
    >
      <Form className="flex flex-col w-72 space-y-5">
        <Field
          name="icon"
          label="Icon"
          component={TextInput}
          placeholder="chris@myriadcode.co"
          StartAdornment={
            <IconAdornment Icon={<Calendar />} position="start" />
          }
        />
        <Field
          name="addOn"
          label="Add On"
          component={TextInput}
          placeholder="eisbuk.com"
          StartAdornment={<AddOnAdornment label="http://" />}
        />
        <Field
          name="dropdown"
          label="Dropdown"
          component={TextInput}
          EndAdornment={
            <Dropdown
              className="!border-none"
              label="country"
              options={["US", "CA", "EU"]}
            />
          }
        />
        <Field
          name="button"
          label="Button"
          component={TextInput}
          placeholder="John Smith"
          EndAdornment={<ButtonAdornment Icon={<Calendar />} label="Sort" />}
        />
      </Form>
    </Formik>
  </>
);
