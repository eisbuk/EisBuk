import React from "react";

import Box from "@material-ui/core/Box";

import makeStyles from "@material-ui/styles/makeStyles";

import { Slot } from "eisbuk-shared";

import SlotCard from "@/components/slots/SlotCard";

const useStyles = makeStyles(() => ({}));

interface Props {
  slots: Slot<"id">[];
  deleteSlot: (slot: Slot<"id">) => void;
}

const SlotList: React.FC<Props> = ({ slots, deleteSlot }) => {
  const classes = useStyles();
  return (
    <Box className={(classes as any).root}>
      {slots &&
        slots.map((slot) => (
          <SlotCard key={slot.id} deleteSlot={deleteSlot} slot={slot} />
        ))}
    </Box>
  );
};

export default SlotList;
