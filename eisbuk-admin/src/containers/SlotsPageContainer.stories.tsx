import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import firebase from "firebase/app";
import "firebase/firestore";
import { DateTime } from "luxon";
import seedrandom from "seedrandom";
import _ from "lodash";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import { Category, SlotType } from "eisbuk-shared";
import {
  DeprecatedSlot,
  DeprecatedBookingInfo as BookingInfo,
} from "eisbuk-shared/dist/types/deprecated/firestore";
import { DeprecatedDuration } from "eisbuk-shared/dist/enums/deprecated/firestore";

import { __storybookDate__ } from "@/lib/constants";

import SlotsPageContainer from "@/containers/SlotsPageContainer";
import { SlotOperation } from "@/types/deprecated/slotOperations";
import { CustomerRoute } from "@/enums/routes";

export default {
  title: "Slots Page Container",
  component: SlotsPageContainer,
  argTypes: {
    onDelete: { action: "deleted" },
    onCreateSlot: { action: "created" },
    onSubscribe: { action: "subscribed" },
    onUnsubscribe: { action: "unsubscribed" },
  },
} as ComponentMeta<typeof SlotsPageContainer>;

// create seed for pseudo-random values in order to get random values,
// but keep them between builds (mainly for chromatic diff)
const PRNG = seedrandom("foobar");

// Alter Math.random to refer to seedrandom's PRNG.
Math.random = PRNG;
// Assign a new Lodash context to a separate variable AFTER altering Math.random.
const lodash = _.runInContext();

const Timestamp = firebase.firestore.Timestamp;

const Template: ComponentStory<typeof SlotsPageContainer> = ({
  onSubscribe,
  onUnsubscribe,
  ...props
}) => {
  const [subscribedSlots, setSubscribedSlots] = useState({});

  const handleSubscribe = onSubscribe
    ? (slot: BookingInfo) => {
        setSubscribedSlots({ ...subscribedSlots, [slot.id]: slot });
        onSubscribe(slot);
      }
    : () => {};

  const handleUnsubscribe = onUnsubscribe
    ? (slot: Parameters<SlotOperation>[0]) => {
        const newSubscribedSlots = { ...subscribedSlots };
        delete newSubscribedSlots[slot.id];

        setSubscribedSlots(newSubscribedSlots);

        onUnsubscribe(slot);
      }
    : () => {};

  return (
    <div>
      <SlotsPageContainer
        {...{ ...props, subscribedSlots }}
        onSubscribe={handleSubscribe}
        onUnsubscribe={handleUnsubscribe}
      />
    </div>
  );
};

export const NoSlotsIce = Template.bind({});
NoSlotsIce.args = {
  slots: {
    "2021-01-20": {},
    "2021-01-01": {},
  },
  view: CustomerRoute.BookIce,
};

export const NoSlotsOffIce = Template.bind({});
NoSlotsOffIce.args = {
  slots: {
    "2021-01-20": {},
    "2021-01-01": {},
  },
  view: CustomerRoute.BookOffIce,
};

export const OneSlotIce = Template.bind({});
OneSlotIce.args = {
  ...NoSlotsIce.args,
  slots: {
    "2021-01-21": {},
    "2021-01-18": {},
    "2021-01-25": {
      foo: {
        id: "foo",
        categories: [Category.Competitive],
        type: SlotType.Ice,
        date: new Timestamp(1609513200, 0),
        durations: [DeprecatedDuration["1h"]],
        notes: "Pista 1",
      },
    },
  },
  view: CustomerRoute.BookIce,
};

export const OneSlotOffIce = Template.bind({});
OneSlotOffIce.args = {
  ...NoSlotsOffIce.args,
  slots: {
    "2021-01-21": {},
    "2021-01-18": {},
    "2021-01-20": {
      foo: {
        id: "foo",
        categories: [Category.Competitive],
        type: SlotType.OffIceDancing,
        date: new Timestamp(1609513200, 0),
        durations: [DeprecatedDuration["1h"]],
        notes: "Pista 1",
      },
    },
  },
  view: CustomerRoute.BookOffIce,
};

const NOTES = ["", "Pista 1", "Pista 2"];

/**
 * Create dummy slots for storybook view
 * @param date
 * @param seed
 * @returns
 */
const createSlots = (date: DateTime, seed: string, view: CustomerRoute) => {
  const random = seedrandom(seed);

  const slots: Record<string, Record<string, DeprecatedSlot<"id">>> = {};

  Array(30)
    .fill(null)
    .forEach((_, i) => {
      const days = i - 15;

      for (let j = 0; j < 10; j++) {
        const hours = 10 + j;
        const slotDate = date.plus({ days, hours });
        const slotId = uuidv4();
        if (random() > 0.3) {
          continue;
        }
        slots[slotDate.toISODate()] = slots[slotDate.toISODate()] || {};
        slots[slotDate.toISODate()][slotId] = {
          id: uuidv4(),
          date: new Timestamp(slotDate.second, 0),
          categories: [Category.Competitive],
          type:
            view === CustomerRoute.BookOffIce
              ? SlotType.OffIceDancing
              : SlotType.Ice,
          durations: [DeprecatedDuration["1h"]],
          notes: lodash.sample(NOTES) || "",
        };
      }
    });

  return slots;
};

const manySlotsDate = DateTime.fromISO(__storybookDate__!);

export const ManySlotsIce = Template.bind({});
ManySlotsIce.args = {
  ...NoSlotsIce.args,
  slots: createSlots(manySlotsDate, "seed123", CustomerRoute.BookIce),
  view: CustomerRoute.BookIce,
};

export const ManySlotsOffIce = Template.bind({});
ManySlotsOffIce.args = {
  ...NoSlotsOffIce.args,
  slots: createSlots(manySlotsDate, "seed123", CustomerRoute.BookOffIce),
  view: CustomerRoute.BookOffIce,
};
