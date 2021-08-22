import React from "react";

import IconButton from "@material-ui/core/IconButton";

import DeleteIcon from "@material-ui/icons/Delete";

import { __deleteButtonId__ } from "./__testData__/testIds";

export const NewSlotButton: React.FC = () => {
  return (
    <>
      <IconButton size="small" data-testid={__deleteButtonId__}>
        <DeleteIcon />
      </IconButton>
    </>
  );
};

export default NewSlotButton;
