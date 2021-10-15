import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik } from "formik";

import Cake from "@material-ui/icons/Cake";

import DateInput from "./DateInput";

export default {
  title: "Date Input",
  component: DateInput,
  // decorators: [
  //   (Story) => (
  //     <Formik initialValues={{}} onSubmit={() => {}}>
  //       <Story />
  //     </Formik>
  //   ),
  // ],
} as ComponentMeta<typeof DateInput>;

export const Default = (): JSX.Element => (
  <Formik initialValues={{}} onSubmit={() => {}}>
    <DateInput name="date" />
  </Formik>
);
export const WithIcon = (): JSX.Element => (
  <Formik initialValues={{}} onSubmit={() => {}}>
    <DateInput name="date" Icon={Cake} />
  </Formik>
);
const error = {
  date: "invalid",
};
export const WithError = (): JSX.Element => (
  <Formik initialValues={{}} initialErrors={error} onSubmit={() => {}}>
    <DateInput name="date" Icon={Cake} />
  </Formik>
);
