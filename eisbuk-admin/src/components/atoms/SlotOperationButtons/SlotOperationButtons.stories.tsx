import React from "react";
import { ComponentMeta } from "@storybook/react";

import SlotOperationButtons from "./SlotOperationButtons";
import { SlotButton } from "@/enums/components";

export default {
  title: "Slot Operation Buttons",
  component: SlotOperationButtons,
} as ComponentMeta<typeof SlotOperationButtons>;

const props = {
  buttons: [
    {
      component: SlotButton.New,
    },
  ],
};

export const Default = (): JSX.Element => <SlotOperationButtons {...props} />;
