import React from "react";

import Button from "@material-ui/core/Button";

import { store } from "@/store/index";

import { closeSnackbar } from "@/store/actions/appActions";

import { SnackbarKey } from "notistack";

/**
 * Standardized action function to be used with `notistack` notifications
 * @param key notification key
 * @returns action button
 */
const NotificationButton = (key: SnackbarKey): JSX.Element => (
  <Button variant="outlined" onClick={() => store.dispatch(closeSnackbar(key))}>
    OK
  </Button>
);

export default NotificationButton;
