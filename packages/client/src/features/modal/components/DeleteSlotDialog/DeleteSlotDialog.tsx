import React from "react";
import { useDispatch } from "react-redux";

import { SlotInterface } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import { deleteSlot } from "@/store/actions/slotOperations";
import SlotCard from "@/components/atoms/SlotCard";

type DeleteSlotDialogProps = BaseModalProps & SlotInterface;

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

  const body = <SlotCard {...slot} />;

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, onConfirm, className }}
      cancelLabel={i18n.t(ActionButton.Cancel)}
      confirmLabel={i18n.t(ActionButton.Delete)}
    >
      {body}
    </ActionDialog>
  );
};

export default DeleteSlotDialog;
