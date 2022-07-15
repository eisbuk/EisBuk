import React from "react";
import { ComponentMeta } from "@storybook/react";

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
} from "./";

export default {
  title: "TextInput",
  component: TextInput,
} as ComponentMeta<typeof TextInput>;

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

const errorFormikFieldMock = {
  ...defaultFormikFieldMock,
  meta: {
    value: "",
    error: "This is erroneous",
    touched: true,
    initialTouched: false,
  },
};

export const Default = (): JSX.Element => (
  <>
    <h1 className="text-lg font-bold mb-4">Default</h1>
    <div className="flex flex-col w-72 space-y-5">
      <TextInput
        // eslint-disable-next-line
        // @ts-ignore
        formikField={defaultFormikFieldMock}
        label="Email"
        placeholder="chris@myriad.co"
        helpText="We'll only use this for spam."
      />
      <TextInput
        // eslint-disable-next-line
        // @ts-ignore
        formikField={errorFormikFieldMock}
        label="Email"
        placeholder="invalid@email.co"
        helpText="We'll only use this for spam."
      />
      <TextInput
        // eslint-disable-next-line
        // @ts-ignore
        formikField={defaultFormikFieldMock}
        label="Email"
        placeholder="disabled@myriad.co"
        helpText="We'll only use this for spam."
        disabled={true}
      />
    </div>
    <h1 className="text-lg font-bold mb-4">Adornments</h1>

    <div className="flex flex-col w-72 space-y-5">
      <TextInput
        // eslint-disable-next-line
        // @ts-ignore
        formikField={defaultFormikFieldMock}
        label="Icon"
        placeholder="chris@myriadcode.co"
        StartAdornment={<IconAdornment Icon={Calendar} position="start" />}
      />
      <TextInput
        // eslint-disable-next-line
        // @ts-ignore
        formikField={defaultFormikFieldMock}
        label="Add On"
        placeholder="eisbuk.com"
        StartAdornment={<AddOnAdornment label="http://" />}
      />
      <TextInput
        // eslint-disable-next-line
        // @ts-ignore
        formikField={defaultFormikFieldMock}
        label="Dropdown"
        EndAdornment={
          <DropdownAdornment name="country" options={["US", "CA", "EU"]} />
        }
      />
      <TextInput
        // eslint-disable-next-line
        // @ts-ignore
        formikField={defaultFormikFieldMock}
        label="Button"
        placeholder="John Smith"
        EndAdornment={<ButtonAdornment Icon={Calendar} label="Sort" />}
      />
    </div>
  </>
);
