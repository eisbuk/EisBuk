import React from "react";

import Box from "@material-ui/core/Box";

import { Slot } from "eisbuk-shared";

import SlotCard from "@/components/slots/SlotCard";

interface Props {
  slots: Slot<"id">[];
  deleteSlot: (slot: Slot<"id">) => void;
}

const SlotList: React.FC<Props> = ({ slots, deleteSlot }) => (
  <Box>
    {slots &&
      slots.map((slot) => (
        <SlotCard key={slot.id} deleteSlot={deleteSlot} slot={slot} />
      ))}
  </Box>
);

export default SlotList;
