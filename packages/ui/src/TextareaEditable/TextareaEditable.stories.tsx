import React from "react";
import { ComponentMeta } from "@storybook/react";

import TextareaEditable from "./TextareaEditable";

export default {
  title: "Textarea Editable",
  component: TextareaEditable,
} as ComponentMeta<typeof TextareaEditable>;

export const Default = (): JSX.Element => <TextareaEditable />;
