import React from "react";
import { ComponentMeta } from "@storybook/react";

import Container from "@material-ui/core/Container";

import AuthDialog from "./AuthDialog";

export default {
  title: "Auth Dialog",
  component: AuthDialog,
  decorators: [
    (Story) => (
      <Container style={{ width: "50rem" }}>
        <Story />
      </Container>
    ),
  ],
} as ComponentMeta<typeof AuthDialog>;

export const Default = (): JSX.Element => <AuthDialog />;
