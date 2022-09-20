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
              name="country"
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

export const Multiline = (): JSX.Element => (
  <div>
    <p className="mt-4 mb-12 text-gray-500">
      <em>
        In order to render a multiline (textarea) element, the component needs
        to receive the 'multiline = true' prop. Additionally, the number of rows
        can be specified using the 'rows' prop. If not specified, it falls back
        to 2
      </em>
    </p>
    <Formik initialValues={{}} onSubmit={() => {}}>
      <div className="grid grid-cols-2 gap-4">
        <Field
          name="tworows"
          label="Rows: 2"
          component={TextInput}
          placeholder="Write some long text"
          multiline={true}
          className="col-span-1"
          rows={2}
        />
        <Field
          name="fiverows"
          label="Rows: 5"
          component={TextInput}
          placeholder="Write some long text"
          multiline={true}
          className="col-span-1"
          rows={5}
        />
        <Field
          name="twelverows"
          label="Rows: 12"
          component={TextInput}
          placeholder="Write some long text"
          multiline={true}
          className="col-span-2"
          rows={12}
        />
      </div>
    </Formik>
  </div>
);
