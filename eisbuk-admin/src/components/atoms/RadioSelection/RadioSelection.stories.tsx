import React from "react";
import { ComponentMeta } from "@storybook/react";
import { Formik } from "formik";

import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

import { SlotType } from "eisbuk-shared";

import RadioSelection from "./RadioSelection";

export default {
  title: "Radio Selection",
  component: RadioSelection,
  decorators: [
    (Story) => (
      <Container style={{ width: "36rem" }}>
        <Paper style={{ padding: "1rem" }} elevation={2}>
          <Typography
            variant="h5"
            style={{ width: "100%", textAlign: "center" }}
          >
            Radio Selection Preview
          </Typography>
          <Story />
        </Paper>
      </Container>
    ),
  ],
} as ComponentMeta<typeof RadioSelection>;

const name = "type";

const options = Object.values(SlotType).map((type) => ({
  value: type,
  label: type,
}));

export const Default = (): JSX.Element => (
  <Formik initialValues={{}} onSubmit={() => {}}>
    <RadioSelection {...{ options, name }} />
  </Formik>
);

export const WithError = (): JSX.Element => (
  <Formik
    initialValues={{}}
    initialErrors={{ [name]: "At least one selection is required" }}
    onSubmit={() => {}}
  >
    <RadioSelection {...{ options, name }} />
  </Formik>
);
