import { __storybookDate__ } from "@/lib/constants";
import { DateTime } from "luxon";
import React from "react";

import SlotForm from "./SlotForm";

export default {
  title: "New Slot Form",
  component: SlotForm,
};

export const Default = (): JSX.Element => (
  <SlotForm date={DateTime.fromISO(__storybookDate__)} onClose={() => {}} />
);
