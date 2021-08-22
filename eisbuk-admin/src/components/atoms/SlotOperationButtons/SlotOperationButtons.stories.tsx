import React from "react";
import { ComponentMeta } from "@storybook/react";

import SlotOperationButtons from "./SlotOperationButtons";

export default {
  title: "Slot Operation Buttons",
  component: SlotOperationButtons,
} as ComponentMeta<typeof SlotOperationButtons>;

export const Default = (): JSX.Element => <SlotOperationButtons />;
