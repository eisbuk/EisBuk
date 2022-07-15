import React from "react";
import { ComponentMeta } from "@storybook/react";

import Checkbox from "./";

export default {
  title: "Forms / Checkbox",
  component: Checkbox,
} as ComponentMeta<typeof Checkbox>;

// TODO: Fix/tidy mocked Formik FieldProps
const defaultFormikFieldMock = {
  field: {
    name: "test",
    onChange: () => {},
    onBlur: () => {},
  },
  meta: {
    error: "",
    touched: false,
    initialTouched: false,
  },
};

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <div className="flex flex-col w-72 space-y-5">
      <Checkbox
        // eslint-disable-next-line
        // @ts-ignore
        formikField={defaultFormikFieldMock}
        label="Select an option?"
        helpText="Unchecked & focssuable"
      />
      <Checkbox
        // eslint-disable-next-line
        // @ts-ignore
        formikField={{ ...defaultFormikFieldMock, field: { checked: true } }}
        label="Select an option?"
        helpText="Option checked"
      />
      <Checkbox
        // eslint-disable-next-line
        // @ts-ignore
        formikField={{ ...defaultFormikFieldMock, field: { checked: true } }}
        label="Select an option?"
        helpText="Option checked - readonly"
        disabled={true}
      />
    </div>
  </>
);
