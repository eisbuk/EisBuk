import React from "react";

import IconButton from "@material-ui/core/IconButton";

import AssignmentIcon from "@material-ui/icons/Assignment";

import { __pasteButtonId__ } from "./__testData__/testIds";

export const NewSlotButton: React.FC = () => {
  return (
    <>
      <IconButton size="small" data-testid={__pasteButtonId__}>
        <AssignmentIcon />
      </IconButton>
    </>
  );
};

export default NewSlotButton;
