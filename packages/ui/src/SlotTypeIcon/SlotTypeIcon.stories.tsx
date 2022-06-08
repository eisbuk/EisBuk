import React from "react";

import { SlotType } from "@eisbuk/shared";

import SlotTypeIcon from "./SlotTypeIcon";

export default {
  title: "Slot Type Icon",
  component: SlotTypeIcon,
};

export const Variants = (): JSX.Element => (
  <>
    Ice:
    <SlotTypeIcon type={SlotType.Ice} className="max-w-md mb-3" />
    Off Ice:
    <SlotTypeIcon type={SlotType.OffIce} className="max-w-md mb-3" />
  </>
);
