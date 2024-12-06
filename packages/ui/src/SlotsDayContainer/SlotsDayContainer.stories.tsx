import React from "react";
import { ComponentMeta } from "@storybook/react";

import { Category, SlotInterface, SlotType } from "@eisbuk/shared";
import { PlusCircle, Copy, ClipboardList, Close, Pencil } from "@eisbuk/svg";

import SlotsDayContainer from "./SlotsDayContainer";
import IntervalCard, { IntervalCardVariant } from "../IntervalCard";
import Button from "../Button";
import { DateTime } from "luxon";

export default {
  title: "Slots Day Container",
  component: SlotsDayContainer,
} as ComponentMeta<typeof SlotsDayContainer>;

const date = "2022-01-01";

const iceSlot: SlotInterface = {
  id: "ice-slot",
  intervals: {
    "09:00-11:00": {
      startTime: "09:00",
      endTime: "11:00",
    },
    "09:00-10:30": {
      startTime: "09:00",
      endTime: "10:30",
    },
    "09:00-10:00": {
      startTime: "09:00",
      endTime: "10:00",
    },
  },
  categories: [Category.Competitive],
  type: SlotType.Ice,
  date,
  notes: "Rink 1",
};
const offIceSlot = {
  ...iceSlot,
  id: "off-ice-slot",
  type: SlotType.OffIce,
};

export const Empty = (): JSX.Element => (
  <SlotsDayContainer {...{ date }}></SlotsDayContainer>
);

export const WithSlots = (): JSX.Element => (
  <SlotsDayContainer {...{ date }}>
    {Object.keys(iceSlot.intervals).map((key) => (
      <IntervalCard
        {...iceSlot}
        key={`ice-${key}`}
        variant={IntervalCardVariant.Booking}
        interval={iceSlot.intervals[key]}
      />
    ))}
    {Object.keys(offIceSlot.intervals).map((key) => (
      <IntervalCard
        {...offIceSlot}
        key={`off-ice-${key}`}
        variant={IntervalCardVariant.Booking}
        interval={iceSlot.intervals[key]}
      />
    ))}
  </SlotsDayContainer>
);

const additionalContent = (
  <div className="!text-gray-500 flex justify-end items-center gap-1">
    <Button className="w-12 h-12 !p-1 text-gray-600 rounded-full overflow-hidden md:h-8 md:w-8">
      <PlusCircle />
    </Button>
    <Button className="w-12 h-12 !p-1 text-gray-600 rounded-full overflow-hidden md:h-8 md:w-8">
      <Copy />
    </Button>
    <Button className="w-12 h-12 !p-1 text-gray-600 rounded-full overflow-hidden md:h-8 md:w-8">
      <ClipboardList />
    </Button>
  </div>
);

export const WithButtons = (): JSX.Element => (
  <div className="content-container">
    <SlotsDayContainer {...{ date, additionalContent }} />
  </div>
);

export const PrototypeSlotsPage = (): JSX.Element => {
  const [canEdit, setCanEdit] = React.useState(false)

  return (
    <div className="relative content-container">
      {Array(7)
        .fill(null)
        .map((_, i) => (
          <SlotsDayContainer
            key={i}
            date={DateTime.fromISO(date).plus({ days: i }).toISODate()}
            additionalContent={canEdit ? additionalContent : <div className="h-12 md:h-auto" />}
          >
            <div className="content-container h-80 w-full bg-gray-100 rounded-md border-gray-200" />
          </SlotsDayContainer>
        ))}

      <div
        className="fixed bottom-0 left-4 right-4 flex justify-end p-2 bg-ice-300 z-40 border-t border-gray-300"
      >
        {canEdit ? (
          <div
            className="flex justify-end items-center gap-1"
          >
            <Button className="w-12 h-12 !p-1 text-gray-600 rounded-full overflow-hidden">
              <Copy />
            </Button>
            <Button className="w-12 h-12 !p-1 text-gray-600 rounded-full overflow-hidden">
              <ClipboardList />
            </Button>
            <Button
              onClick={() => setCanEdit(false)}
              className="w-12 h-12 text-gray-600"
            >
              <Close />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setCanEdit(true)}
            className="w-12 h-12 text-gray-600"
          >
            <Pencil />
          </Button>
        )}
      </div>
    </div >
  )
};
