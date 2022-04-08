import React from "react";
import { useDispatch } from "react-redux";

import Button from "@mui/material/Button";

import { closeSnackbar } from "@/store/actions/appActions";

import { SnackbarKey } from "notistack";
import { __notificationButton__ } from "@/__testData__/testIds";

/**
 * Standardized action function to be used with `notistack` notifications
 * @param key notification key
 * @returns action button
 */
const NotificationButton = (key: SnackbarKey): JSX.Element => {
  const dispatch = useDispatch();

  return (
    <Button
      data-testid={__notificationButton__}
      variant="outlined"
      onClick={() => dispatch(closeSnackbar(key))}
    >
      OK
    </Button>
  );
};

export default NotificationButton;
