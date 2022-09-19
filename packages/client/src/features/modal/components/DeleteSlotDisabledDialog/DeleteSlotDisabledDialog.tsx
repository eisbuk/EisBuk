import React from "react";

import { SlotInterface } from "@eisbuk/shared";
import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

import SlotCard from "@/components/atoms/SlotCard";

type DeleteSlotDisabledDialogProps = BaseModalProps & SlotInterface;

const DeleteSlotDialog: React.FC<DeleteSlotDisabledDialogProps> = ({
  onClose,
  className,
  ...slot
}) => {
  const title = i18n.t(Prompt.DeleteSlotDisabledTitle);

  const body = (
    <div>
      <p className="mb-2">{i18n.t(Prompt.DeleteSlotDisabled)}</p>
      <SlotCard {...slot} />
    </div>
  );

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, className }}
      cancelLabel={i18n.t(ActionButton.Dismiss)}
    >
      {body}
    </ActionDialog>
  );
};

export default DeleteSlotDialog;
