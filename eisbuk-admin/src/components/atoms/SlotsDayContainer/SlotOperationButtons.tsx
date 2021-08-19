import React from "react";

import IconButton from "@material-ui/core/IconButton";
import Box from "@material-ui/core/Box";

import FileCopyIcon from "@material-ui/icons/FileCopy";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import AssignmentIcon from "@material-ui/icons/Assignment";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Slot } from "eisbuk-shared";

interface Props {
  slots?: Slot<"id">[];
}

const SlotOperationButtons: React.FC<Props> = ({ slots }) => {
  const classes = useStyles();

  /** @TEMP */
  const doPaste = () => {};
  const dispatch = (..._: any) => {};
  const copySlotDay = (slots: any): void => {
    console.log(slots);
  };
  const showCreateForm = () => {};
  /** @TEMP */

  return (
    <Box display="flex" className={classes.dateButtons}>
      <IconButton size="small" onClick={showCreateForm}>
        <AddCircleOutlineIcon />
      </IconButton>
      {Boolean(slots?.length) && (
        <IconButton size="small" onClick={() => dispatch(copySlotDay(slots))}>
          <FileCopyIcon />
        </IconButton>
      )}
      {/* {Object.keys(dayInClipboard).length > 0 && ( */}
      <IconButton size="small" onClick={doPaste}>
        <AssignmentIcon />
      </IconButton>
      {/* )} */}
    </Box>
  );
};

const useStyles = makeStyles(() => ({
  dateButtons: {
    "flex-grow": 0,
  },
}));

export default SlotOperationButtons;
