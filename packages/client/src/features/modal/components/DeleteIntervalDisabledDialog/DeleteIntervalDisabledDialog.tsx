import React from "react";
import { SlotInterval } from "@eisbuk/shared";

import { ActionDialog } from "@eisbuk/ui";
import i18n, { ActionButton, Prompt } from "@eisbuk/translations";

import { BaseModalProps } from "../../types";

const DeleteIntervalDialog: React.FC<BaseModalProps & SlotInterval> = ({
  onClose,
  className,
  ...interval
}) => {
  const title = i18n.t(Prompt.DeleteIntervalDisabledTitle);

  return (
    <ActionDialog
      onCancel={onClose}
      {...{ title, className }}
      cancelLabel={i18n.t(ActionButton.Dismiss)}
    >
      <p className="mb-8">{i18n.t(Prompt.DeleteIntervalDisabled)}</p>
      <div className="w-fit p-1 rounded-md bg-white outline outline-2 outline-gray-300">
        {interval.startTime}-{interval.startTime}
      </div>
    </ActionDialog>
  );
};

export default DeleteIntervalDialog;
