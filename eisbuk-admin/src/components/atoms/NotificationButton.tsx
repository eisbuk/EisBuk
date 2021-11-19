import React from "react";
import { useDispatch } from "react-redux";

import Button from "@material-ui/core/Button";

import { closeSnackbar } from "@/store/actions/appActions";

import { SnackbarKey } from "notistack";

/**
 * Standardized action function to be used with `notistack` notifications
 * @param key notification key
 * @returns action button
 */
const NotificationButton = (key: SnackbarKey): JSX.Element => {
  const dispatch = useDispatch();

  return (
    <Button variant="outlined" onClick={() => dispatch(closeSnackbar(key))}>
      OK
    </Button>
  );
};

export default NotificationButton;
