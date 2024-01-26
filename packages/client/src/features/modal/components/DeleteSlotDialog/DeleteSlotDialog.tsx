import React from "react";
import { useDispatch } from "react-redux";

import { SlotInterface } from "@eisbuk/shared";
import { ActionDialog, SlotCard } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { ModalProps } from "@/features/modal/types";

import { deleteSlot } from "@/store/actions/slotOperations";

type DeleteSlotDialogProps = ModalProps<SlotInterface>;

const DeleteSlotDialog: React.FC<DeleteSlotDialogProps> = ({
  onClose,
  className,
  ...slot
}) => {
  const dispatch = useDispatch();

  const onConfirm = () => {
    dispatch(deleteSlot(slot.id));
    onClose();
  };

  const title = i18n.t(Prompt.DeleteSlot);

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, onConfirm, className }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.Delete)}
    >
      <SlotCard className="mt-4" {...slot} />;
    </ActionDialog>
  );
};

export default DeleteSlotDialog;
