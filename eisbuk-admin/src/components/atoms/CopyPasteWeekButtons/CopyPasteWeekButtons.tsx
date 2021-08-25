import React from "react";

import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";

import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import AssignmentIcon from "@material-ui/icons/Assignment";

const CopyPasteWeekButtons: React.FC = () => {
  return (
    <>
      {/* {showWeekDeleteConfirm ? (
        <ConfirmDialog
          title={`${t("SlotsPageContainer.DeleteAllConfirmation")} (${
            slotsArray.length
          }) ${t("SlotsPageContainer.OfTheWeek")} ${t(
            "SlotsPageContainer.CurrentDate",
            {
              date: currentDate,
            }
          )}?`}
          open={showWeekDeleteConfirm}
          setOpen={setShowWeekDeleteConfirm}
          onConfirm={doDelete}
        >
          {t("SlotsPageContainer.NonReversible")}
        </ConfirmDialog>
      ) : null} */}

      <IconButton
        size="small"
        // disabled={slotsArray.length === 0}
        // onClick={() => setShowWeekDeleteConfirm(true)}
      >
        <DeleteIcon />
      </IconButton>
      <IconButton
      // disabled={slotsArray.length === 0}
      // onClick={() =>
      //   dispatch(copySlotWeek({ weekStart: currentDate, slots: slotsArray }))
      // }
      >
        <Badge
          color="secondary"
          variant="dot"
          //   invisible={!(weekToPaste && weekToPaste.slots)}
        >
          <FileCopyIcon />
        </Badge>
      </IconButton>
      <IconButton
        size="small"
        // onClick={doPaste}
        // disabled={
        //   !weekToPaste ||
        //   !weekToPaste.weekStart || // there's nothing to paste
        //   Number(weekToPaste.weekStart) === Number(currentDate) // don't paste over the same week we copied
        // }
      >
        <AssignmentIcon />
      </IconButton>
    </>
  );
};

export default CopyPasteWeekButtons;
