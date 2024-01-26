import React from "react";
import { useDispatch } from "react-redux";

import { SlotForm, SlotFormProps } from "@eisbuk/ui";
import { SlotInterfaceLoose } from "@eisbuk/shared";

import { ModalProps } from "@/features/modal/types";

import { upsertSlot } from "@/store/actions/slotOperations";

type SlotFormDialogProps = ModalProps<
  Omit<SlotFormProps, "onSubmit" | "onClose">
>;

const SlotFormDialog: React.FC<SlotFormDialogProps> = ({
  onClose,
  ...props
}) => {
  const dispatch = useDispatch();

  const handleSubmit = (slot: SlotInterfaceLoose) => {
    dispatch(upsertSlot(slot));
  };

  return (
    <SlotForm
      {...props}
      className="max-w-[640px] w-screen h-full max-h-[90vh] mx-auto shadow-lg rounded border border-cyan-900"
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
};

export default SlotFormDialog;
