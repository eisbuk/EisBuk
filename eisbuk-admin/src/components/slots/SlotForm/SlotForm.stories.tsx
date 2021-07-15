import React from "react";
import SlotForm from "./SlotForm";

export default {
  title: "SlotForm",
  component: SlotForm,
};

const baseProps = {
  open: true,
  isoDate: "2021-01-15",
};

export const EmptyForm = (): JSX.Element => <SlotForm {...baseProps} />;

// EmptyForm.argTypes = {
//   createSlot: { action: "created" },
//   onClose: { action: "closed" },
// };

const initialValues = {
  time: "11:30",
  categories: ["preagonismo"],
  durations: ["60", "120"],
  type: "ice",
  notes: "Here are some notes\nWith two lines",
};

export const FormWithValues = (): JSX.Element => (
  <SlotForm {...baseProps} {...initialValues} />
);
FormWithValues.args = {
  open: true,
  isoDate: "2021-01-15",
  initialValues: {},
};
// FormWithValues.argTypes = {
//   createSlot: { action: "created" },
//   onClose: { action: "closed" },
// };
