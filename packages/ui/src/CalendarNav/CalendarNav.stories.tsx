import React from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import CalendarNav from "./CalendarNav";
import EmptySpace from "../EmptySpace";
import DateDebug from "./DateDebug";

export default {
  title: "Calendar Nav",
  component: CalendarNav,
} as ComponentMeta<typeof CalendarNav>;

export const Default = (): JSX.Element => (
  <CalendarNav date={DateTime.fromISO("2022-04-01")} jump="month" />
);

export const Interactive = (): JSX.Element => {
  const startDate = DateTime.fromISO("2022-04-01");

  const [month, setMonth] = React.useState(startDate);
  const [week, setWeek] = React.useState(startDate);
  const [day, setDay] = React.useState(startDate);

  return (
    <>
      <h1 className="text-lg font-bold mb-4">Jump: Month</h1>
      <CalendarNav
        className="mb-8"
        date={month}
        onChange={(date) => setMonth(date)}
        jump="month"
      />

      <h1 className="text-lg font-bold mb-4">Jump: Week</h1>
      <CalendarNav
        className="mb-8"
        date={week}
        onChange={(date) => setWeek(date)}
        jump="week"
      />

      <h1 className="text-lg font-bold mb-4">Jump: Day</h1>
      <CalendarNav date={day} onChange={(date) => setDay(date)} jump="day" />
    </>
  );
};

const countdown = (
  <EmptySpace className="md:!h-[32px]">{`Let's pretend this is the <strong>Countdown</strong>`}</EmptySpace>
);
export const WithCountdown = (): JSX.Element => (
  <CalendarNav
    date={DateTime.fromISO("2022-04-01")}
    jump="month"
    additionalContent={countdown}
  />
);

const DateDebugWrapper: React.FC = () => {
  const [date, setDate] = React.useState(DateTime.now());

  return <DateDebug value={date} onChange={setDate} />;
};
export const WithDateDebug = (): JSX.Element => (
  <CalendarNav
    date={DateTime.fromISO("2022-04-01")}
    jump="month"
    additionalContent={<DateDebugWrapper />}
  />
);
