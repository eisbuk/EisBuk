import React from "react";

import { SlotInterface } from "@eisbuk/shared";
import { ActionDialog, SlotCard } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

type DeleteSlotDisabledDialogProps = BaseModalProps & SlotInterface;

const DeleteSlotDialog: React.FC<DeleteSlotDisabledDialogProps> = ({
  onClose,
  className,
  ...slot
}) => {
  const title = i18n.t(Prompt.DeleteSlotDisabledTitle);

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, className }}
      cancelLabel={i18n.t(ActionButton.Dismiss)}
    >
      <p className="mb-8">{i18n.t(Prompt.DeleteSlotDisabled)}</p>
      <SlotCard className="mb-4" {...slot} />
    </ActionDialog>
  );
};

export default DeleteSlotDialog;
