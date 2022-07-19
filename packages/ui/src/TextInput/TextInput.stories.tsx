import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as yup from "yup";

/*
  TODO: "Display mode" of TextInput is not handled through disabled state as planned
    Create DataList or DescriptionList components for Readonly versions of form
*/

// TODO: Add Icons in mock - e.g User, Cake, Phone - worth just installing Heroicons as a dep and make this easier?
import { Calendar } from "@eisbuk/svg";
import TextInput, {
  IconAdornment,
  AddOnAdornment,
  ButtonAdornment,
  DropdownAdornment,
} from ".";

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
        <Field name="default">
          {(field: FieldProps) => (
            <TextInput
              formikField={field}
              label="Email"
              placeholder="chris@myriad.co"
              helpText="We'll only use this for spam."
            />
          )}
        </Field>
        <Field name="withError">
          {(field: FieldProps) => (
            <TextInput
              formikField={field}
              label="Email"
              placeholder="invalid@email.co"
              helpText="We'll only use this for spam."
            />
          )}
        </Field>
        <Field name="disabled">
          {(field: FieldProps) => (
            <TextInput
              formikField={field}
              label="Email"
              placeholder="disabled@myriad.co"
              helpText="We'll only use this for spam."
              disabled={true}
            />
          )}
        </Field>
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
        <Field name="icon">
          {(field: FieldProps) => (
            <TextInput
              formikField={field}
              label="Icon"
              placeholder="chris@myriadcode.co"
              StartAdornment={
                <IconAdornment Icon={Calendar} position="start" />
              }
            />
          )}
        </Field>
        <Field name="addOn">
          {(field: FieldProps) => (
            <TextInput
              formikField={field}
              label="Add On"
              placeholder="eisbuk.com"
              StartAdornment={<AddOnAdornment label="http://" />}
            />
          )}
        </Field>
        <Field name="dropdown">
          {(field: FieldProps) => (
            <TextInput
              formikField={field}
              label="Dropdown"
              EndAdornment={
                <DropdownAdornment
                  name="country"
                  options={["US", "CA", "EU"]}
                />
              }
            />
          )}
        </Field>
        <Field name="button">
          {(field: FieldProps) => (
            <TextInput
              formikField={field}
              label="Button"
              placeholder="John Smith"
              EndAdornment={<ButtonAdornment Icon={Calendar} label="Sort" />}
            />
          )}
        </Field>
      </Form>
    </Formik>
  </>
);
