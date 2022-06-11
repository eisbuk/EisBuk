import React from "react";
import { ComponentMeta } from "@storybook/react";

import ActionDialog from "./ActionDialog";

export default {
  title: "Action Dialog",
  component: ActionDialog,
} as ComponentMeta<typeof ActionDialog>;

export const Default = (): JSX.Element => (
  <div className="w-screen h-screen bg-gray-200">
    <ActionDialog
      title="Cancel booking for"
      cancelLabel="Go Back"
      confirmLabel="Confirm Cancellation"
      setOpen={() => {}}
      onConfirm={() => {}}
      open={true}
    >
      This is a message about what is about to be cancelled
    </ActionDialog>
  </div>
);
