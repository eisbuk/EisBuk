import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";
import { DateTime } from "luxon";

import { Printer, PlusCircle, Copy } from "@eisbuk/svg";

import CalendarNav from "./CalendarNav";
import EmptySpace from "../EmptySpace";
import Button, { ButtonColor } from "../Button";

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

export const WithAdditionalContent = (): JSX.Element => {
  const [canEdit, setCanEdit] = useState(false);
  const toggleEdit = () => setCanEdit(!canEdit);

  return (
    <>
      <h1 className="text-lg font-bold mb-4">Daily attendance view</h1>
      <CalendarNav
        date={DateTime.fromISO("2022-04-01")}
        jump="month"
        additionalContent={
          <Button className="h-8 w-8 !p-[2px] hidden rounded-full text-gray-700 hover:bg-black/10 md:flex">
            <Printer />
          </Button>
        }
      />

      <h1 className="text-lg font-bold my-4">Slots view</h1>
      <CalendarNav
        date={DateTime.fromISO("2022-04-01")}
        jump="month"
        additionalContent={
          <div className="hidden items-center justify-center md:flex ">
            {canEdit && (
              <div className="flex items-center gap-4 mx-4 md:mr-4 md:gap-1">
                <Button className="h-12 w-12 md:h-8 md:w-8 !p-1 text-gray-600 rounded-full overflow-hidden">
                  <PlusCircle />
                </Button>
                <Button className="h-12 w-12 md:h-8 md:w-8 !p-1 text-gray-600 rounded-full overflow-hidden">
                  <Copy />
                </Button>
              </div>
            )}

            <Button
              onClick={toggleEdit}
              color={canEdit ? ButtonColor.Primary : undefined}
              className={
                !canEdit
                  ? "!text-black outline outline-gray-300 border-box"
                  : ""
              }
            >
              Enable edit
            </Button>
          </div>
        }
      />
    </>
  );
};

export const WithCountdown = (): JSX.Element => (
  <CalendarNav
    date={DateTime.fromISO("2022-04-01")}
    jump="month"
    additionalContent={countdown}
  />
);
