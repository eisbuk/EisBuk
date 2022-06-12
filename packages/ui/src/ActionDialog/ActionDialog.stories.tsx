import React from "react";
import { ComponentMeta } from "@storybook/react";

import ActionDialog from "./ActionDialog";

export default {
  title: "Action Dialog",
  component: ActionDialog,
} as ComponentMeta<typeof ActionDialog>;

export const Default = (): JSX.Element => (
  <div className="w-screen h-screen bg-gray-800">
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
      <ActionDialog
        title="Cancel booking for"
        cancelLabel="Go Back"
        confirmLabel="Confirm Cancellation"
        setOpen={() => {}}
        onConfirm={() => {}}
      >
        This is a placeholder message for a Simple Interval Card, but also stunt
        doubles as a TextContent variant?
      </ActionDialog>
    </div>
  </div>
);
