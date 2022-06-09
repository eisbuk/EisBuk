import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import CalendarNav from "./CalendarNav";
import EmptySpace from "../EmptySpace";

export default {
  title: "Calendar Nav",
  component: CalendarNav,
} as ComponentMeta<typeof CalendarNav>;

export const Default = (): JSX.Element => (
  <CalendarNav date={DateTime.fromISO("2022-04-01")} jump="month" />
);

const countdown = (
  <EmptySpace className="md:!h-[32px]">{`Let's pretend this is the <strong>Countdown</strong>`}</EmptySpace>
);
export const WithConuntdown = (): JSX.Element => (
  <CalendarNav
    date={DateTime.fromISO("2022-04-01")}
    jump="month"
    additionalContent={countdown}
  />
);
