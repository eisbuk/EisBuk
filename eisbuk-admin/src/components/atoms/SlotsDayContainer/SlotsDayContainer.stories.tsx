import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import { __storybookDate__ } from "@/lib/constants";

import SlotsDayContainer from "./SlotsDayContainer";

export default {
  title: "Slots Day Container",
  component: SlotsDayContainer,
} as ComponentMeta<typeof SlotsDayContainer>;

const baseProps = {
  date: DateTime.fromISO(__storybookDate__),
};

export const Empty = (): JSX.Element => <SlotsDayContainer {...baseProps} />;
