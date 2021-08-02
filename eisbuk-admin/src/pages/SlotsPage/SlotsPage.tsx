import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { SlotOperation } from "@/types/slotOperations";

import SlotsPageContainer from "@/containers/SlotsPageContainer";
import AppbarAdmin from "@/components/layout/AppbarAdmin";

import {
  deleteSlots,
  createSlots,
  editSlot,
} from "@/store/actions/slotOperations";

import { getAllSlotsByDay } from "@/store/selectors/slots";

import { useTitle } from "@/utils/helpers";

const SlotsPage: React.FC = () => {
  const slots = useSelector(getAllSlotsByDay);

  useTitle("Slots");

  const dispatch = useDispatch();

  const onDelete: SlotOperation = (slot) => {
    dispatch(deleteSlots([slot]));
  };

  const onCreateSlot: SlotOperation<"create"> = (slot) => {
    dispatch(createSlots([slot]));
  };

  const onEditSlot: SlotOperation = (slot) => {
    dispatch(editSlot(slot));
  };

  return (
    <div>
      <AppbarAdmin />
      <SlotsPageContainer
        slots={slots}
        onDelete={onDelete}
        onCreateSlot={onCreateSlot}
        onEditSlot={onEditSlot}
      />
    </div>
  );
};

export default SlotsPage;
