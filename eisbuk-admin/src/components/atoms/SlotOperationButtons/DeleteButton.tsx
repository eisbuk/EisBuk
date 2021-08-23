import React, { useContext } from "react";

import IconButton from "@material-ui/core/IconButton";

import DeleteIcon from "@material-ui/icons/Delete";

import { ButtonGropuContext } from "../SlotOperationButtons";

import { __deleteButtonId__ } from "./__testData__/testIds";

export const DeleteButton: React.FC = () => {
  const buttonGroupContext = useContext(ButtonGroupContext);

  return (
    <>
      <IconButton size="small" data-testid={__deleteButtonId__}>
        <DeleteIcon />
      </IconButton>
    </>
  );
};

export default DeleteButton;
