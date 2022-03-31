import React from "react";

import { SlotType } from "@eisbuk/shared";

import SlotTypeIcon from "./SlotTypeIcon";

export default {
  title: "Slot Type Icon",
  component: SlotTypeIcon,
};

export const Default = (): JSX.Element => (
  <div>
    Ice:
    <SlotTypeIcon type={SlotType.Ice} />
    Off Ice:
    <SlotTypeIcon type={SlotType.OffIce} />
  </div>
);
