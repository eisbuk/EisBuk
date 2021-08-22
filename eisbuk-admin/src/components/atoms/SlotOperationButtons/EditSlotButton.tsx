import React from "react";

import IconButton from "@material-ui/core/IconButton";

import { __editSlotButtonId__ } from "./__testData__/testIds";

export const NewSlotButton: React.FC = () => {
  return (
    <>
      <IconButton size="small" data-testid={__editSlotButtonId__}></IconButton>
    </>
  );
};

export default NewSlotButton;
