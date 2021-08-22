import React from "react";

import IconButton from "@material-ui/core/IconButton";

import FileCopyIcon from "@material-ui/icons/FileCopy";

import { __copyButtonId__ } from "./__testData__/testIds";

export const NewSlotButton: React.FC = () => {
  return (
    <>
      <IconButton size="small" data-testid={__copyButtonId__}>
        <FileCopyIcon />
      </IconButton>
    </>
  );
};

export default NewSlotButton;
