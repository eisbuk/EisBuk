import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import Box from "@material-ui/core/Box";
import IconButton from "@material-ui/core/IconButton";

import DeleteIcon from "@material-ui/icons/Delete";
import CreateIcon from "@material-ui/icons/Create";

import { Slot } from "eisbuk-shared";

import SlotForm from "@/components/slots/SlotForm";
import ConfirmDialog from "@/components/global/ConfirmDialog";

import { deleteSlots, editSlot } from "@/store/actions/slotOperations";

import { __editSlotId__, __deleteSlotId__ } from "./__testData__";

/**
 * Used to set which dialog should open (edit form/confirm delete)
 */
enum Dialog {
  Delete = "delete",
  EditForm = "edit-form",
}

/**
 * Slot operation buttons (edit/delete). Shown in admin view if `enableEdit` is true on parent (`SlotCard`) component.
 *
 * Internally, contains logic for dispatching actions to the store as well as form and confirm dialog modals.
 * @param slotData slot we're displaying used for further slot operations
 */
const SlotOperationButtons: React.FC<Slot<"id">> = (slotData) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [openDialog, setOpenDialog] = useState<Dialog | null>(null);

  const handleCloseDialog = () => setOpenDialog(null);

  // #region handleEditForm
  const openEditForm = () => setOpenDialog(Dialog.EditForm);

  type EditSlot = Parameters<typeof SlotForm>[0]["editSlot"];

  const handleSlotEdit: EditSlot = (newSlot) => {
    dispatch(editSlot(newSlot));
  };

  const handleDeleteSlot = () => {
    dispatch(deleteSlots([slotData]));
  };
  // #region handleEditForm

  // #region handleDelete
  /**
   * Dispatch delete slot action to store,
   * fired on delete dialog confirmation
   */
  const { date } = slotData;

  const handleDelete = () => {
    dispatch(deleteSlots([slotData]));
  };

  /**
   * Constols displaying of delete dialog
   * @param open boolean
   * @returns
   */
  const controlDeleteDialog = (open: boolean) =>
    open ? setOpenDialog(Dialog.Delete) : handleCloseDialog();
  // #endregion handleDelete

  return (
    <>
      <Box display="flex" alignItems="center" mr={1}>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={openEditForm}
          size="small"
          data-testid={__editSlotId__}
        >
          <CreateIcon />
        </IconButton>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={handleDeleteSlot}
          size="small"
          data-testid={__deleteSlotId__}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
      <SlotForm
        slotToEdit={slotData}
        editSlot={handleSlotEdit}
        open={openDialog === Dialog.EditForm}
        onClose={handleCloseDialog}
      />
      <ConfirmDialog
        title={`${t("Slots.DeleteConfirmation")} ${t(
          "Slots.ConfirmDialogDate",
          { date }
        )}
          ${t("Slots.ConfirmDialogTime", { date })} ${t("Slots.Slot")}?`}
        open={openDialog === Dialog.Delete}
        setOpen={controlDeleteDialog}
        onConfirm={handleDelete}
      >
        {t("Slots.NonReversible")}
      </ConfirmDialog>
    </>
  );
};

export default SlotOperationButtons;
