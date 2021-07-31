import React from "react";
import { useDispatch, useSelector } from "react-redux";
import _ from "lodash";

import { LocalStore } from "@/types/store";
import { SlotOperation } from "@/types/slotOperations";

import SlotsPageContainer from "@/containers/SlotsPageContainer";
import AppbarAdmin from "@/components/layout/AppbarAdmin";

import {
  deleteSlots,
  createSlots,
  editSlot,
} from "@/store/actions/slotOperations";

import { flatten, useTitle } from "@/utils/helpers";

/** @TODO use imported selector */
const selectSlots = (state: LocalStore) =>
  flatten(state.firestore.ordered.slotsByDay);

const SlotsPage: React.FC = () => {
  const slots = _.omit(useSelector(selectSlots), "id");
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
