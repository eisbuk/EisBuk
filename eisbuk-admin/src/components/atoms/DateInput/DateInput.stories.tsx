import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik } from "formik";
import * as yup from "yup";

import Cake from "@mui/icons-material/Cake";

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
export const WithError = (): JSX.Element => (
  <Formik
    initialValues={{}}
    validationSchema={yup.object().shape({
      date: yup.string().test({ message: "invalid", test: () => false }),
    })}
    onSubmit={() => {}}
  >
    <DateInput name="date" Icon={Cake} />
  </Formik>
);
