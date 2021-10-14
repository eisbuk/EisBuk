import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik } from "formik";

import Cake from "@material-ui/icons/Cake";

import DateInput from "./DateInput";

export default {
  title: "Date Input",
  component: DateInput,
  decorators: [
    (Story) => (
      <Formik initialValues={{}} onSubmit={() => {}}>
        <Story />
      </Formik>
    ),
  ],
} as ComponentMeta<typeof DateInput>;

export const Default = (): JSX.Element => <DateInput name="date" Icon={Cake} />;
