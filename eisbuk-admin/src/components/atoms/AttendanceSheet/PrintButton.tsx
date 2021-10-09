import React from "react";

import IconButton from "@material-ui/core/IconButton";

import PrintIcon from "@material-ui/icons/Print";
import { SlotButtonProps } from "@/types/components";

import {
  __slotButtonNoContextError,
  __copyButtonWrongContextError,
  __noDateCopy,
} from "@/lib/errorMessages";

import { __copyButtonId__ } from "@/__testData__/testIds";
import { Link } from "react-router-dom";

export const PrintButton: React.FC<SlotButtonProps> = ({ size }) => {
  return (
    <>
      <IconButton component={Link} to="/attendance_printable" size={size}>
        <PrintIcon />
      </IconButton>
    </>
  );
};
