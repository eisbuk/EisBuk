import React, { useState } from "react";
import { ComponentMeta } from "@storybook/react";

import { Category, SlotInterface, SlotType } from "@eisbuk/shared";
import { Pencil, Trash } from "@eisbuk/svg";

import SlotCard from "./SlotCard";
import Button from "../Button";

import { baseSlot, createIntervals } from "../__testData__/slots";

export default {
  title: "Slot Card",
  component: SlotCard,
} as ComponentMeta<typeof SlotCard>;

export const Default = (): JSX.Element => (
  <>
    <h2 className="mb-2">Ice:</h2>
    <SlotCard className="mb-8" {...baseSlot} notes="Pista 1" />
    <h2 className="mb-2">Off Ice:</h2>
    <SlotCard {...baseSlot} type={SlotType.OffIce} notes="Pista 1" />
  </>
);

const additionalActions = (
  <div className="h-full ml-auto flex items-center gap-1 bg-inherit">
    <Button className="h-8 w-8 !p-1 text-gray-600 rounded-full overflow-hidden">
      <Pencil />
    </Button>
    <Button className="h-8 w-8 !p-1 text-gray-600 rounded-full overflow-hidden">
      <Trash />
    </Button>
  </div>
);
export const WithActionButtons = (): JSX.Element => (
  <SlotCard {...baseSlot} additionalActions={additionalActions} />
);

const aBunchOfIntervals: SlotInterface = {
  ...baseSlot,
  intervals: { ...baseSlot.intervals, ...createIntervals(11) },
};

export const PackedWithContent = (): JSX.Element => (
  <SlotCard
    {...aBunchOfIntervals}
    notes="This is a long note: A quick brown fox jumped over the lazy dog, while colourless green ideas dream furiously."
    categories={Object.values(Category)}
    additionalActions={additionalActions}
  />
);

export const Selected = (): JSX.Element => {
  // we're using state here to keep things simple and test onClick functionality
  const [selected1, setSelected1] = useState(true);
  const [selected2, setSelected2] = useState(true);

  return (
    <>
      <h2 className="mb-2">Ice:</h2>
      <SlotCard
        className="mb-8"
        {...baseSlot}
        notes="Pista 1"
        selected={selected1}
        onClick={() => setSelected1(!selected1)}
        additionalActions={additionalActions}
      />

      <h2 className="mb-2">Off Ice:</h2>
      <SlotCard
        {...baseSlot}
        type={SlotType.OffIce}
        notes="Pista 1"
        selected={selected2}
        onClick={() => setSelected2(!selected2)}
        additionalActions={additionalActions}
      />
    </>
  );
};
