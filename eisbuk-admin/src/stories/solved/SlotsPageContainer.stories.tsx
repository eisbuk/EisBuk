import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import firebase from "firebase/app";
import "firebase/firestore";
import { DateTime } from "luxon";
import seedrandom from "seedrandom";
import _ from "lodash";

import { Slot as SlotInterface } from "@/types/firestore";

import { Category, Duration, Notes, SlotType } from "@/enums/firestore";

import SlotsPageContainer from "@/containers/SlotsPageContainer";
import { ComponentStory } from "@storybook/react";

export default {
  title: "Slots Page Container",
  component: SlotsPageContainer,
};

const PRNG = seedrandom("foobar");

/* Alter Math.random to refer to seedrandom's PRNG. */
Math.random = PRNG;
/* Assign a new Lodash context to a separate variable AFTER altering Math.random. */
const lodash = _.runInContext();

const Timestamp = firebase.firestore.Timestamp;

const Template: ComponentStory<typeof SlotsPageContainer> = ({
  onSubscribe,
  onUnsubscribe,
  ...props
}) => {
  const [subscribedSlots, setSubscribedSlots] = useState({});

  const handleSubscribe = onSubscribe
    ? (slot: SlotInterface<"id">) => {
        setSubscribedSlots({ ...subscribedSlots, [slot.id]: slot });
        onSubscribe(slot);
      }
    : () => {};

  const handleUnsubscribe = onUnsubscribe
    ? (slot: SlotInterface<"id">) => {
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

export const NoSlots = Template.bind({});
NoSlots.args = {
  slots: {
    "2021-01-20": {},
    "2021-01-01": {},
  },
};

export const OneSlot = Template.bind({});
OneSlot.args = {
  ...NoSlots.args,
  slots: {
    "2021-01-21": {},
    "2021-01-18": {},
    [DateTime.now().toISODate()]: {
      foo: {
        id: "foo",
        categories: [Category.Agonismo],
        type: SlotType.Ice,
        date: new Timestamp(1609513200, 0),
        durations: [Duration["1h"]],
        notes: Notes.Pista1,
      },
    },
  },
};

const NOTES = Object.values(Notes);

/**
 * Create dummy slots for storybook view
 * @param date
 * @param seed
 * @returns
 */
const createSlots = (date: DateTime, seed: string) => {
  const random = seedrandom(seed);

  const slots: Record<string, Record<string, SlotInterface<"id">>> = {};

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
          categories: [Category.Agonismo],
          type: SlotType.Ice,
          durations: [Duration["1h"]],
          notes: lodash.sample(NOTES) || Notes.Null,
        };
      }
    });

  return slots;
};
const manySlotsDate = DateTime.now();

console.log("Time now > ", manySlotsDate);

export const ManySlotsWithEdit = Template.bind({});
ManySlotsWithEdit.args = {
  ...NoSlots.args,
  slots: createSlots(manySlotsDate, "seed123"),
};
ManySlotsWithEdit.argTypes = {
  onDelete: { action: "deleted" },
  onCreateSlot: { action: "created" },
};

export const ManySlotsWithSubscribe = Template.bind({});
ManySlotsWithSubscribe.args = {
  ...NoSlots.args,
  slots: createSlots(manySlotsDate, "seed123"),
};
ManySlotsWithSubscribe.argTypes = {
  onSubscribe: { action: "subscribed" },
  onUnsubscribe: { action: "unsubscribed" },
};
