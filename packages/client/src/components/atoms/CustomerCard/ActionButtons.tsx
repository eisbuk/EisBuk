import React from "react";
import { useHistory } from "react-router-dom";

import Button from "@mui/material/Button";

import makeStyles from "@mui/styles/makeStyles";

import DateRangeIcon from "@mui/icons-material/DateRange";
import Mail from "@mui/icons-material/Mail";
import Phone from "@mui/icons-material/Phone";

import { useTranslation, ActionButton } from "@eisbuk/translations";

import { Routes } from "@/enums/routes";
import { SendBookingLinkMethod } from "@/enums/other";

import { ActionButtonProps } from "./types";

import { createModal } from "@/features/modal/useModal";

import {
  __openBookingsId__,
  __sendBookingsEmailId__,
  __sendBookingsSMSId__,
} from "./__testData__/testIds";

/**
 * Labeled action buttons to open customer's bookings or send
 * booking link via sms/email, rendered as icon + text
 */
const ActionButtons: React.FC<ActionButtonProps> = ({
  customer,
  className,
  onClose,
}) => {
  const { t } = useTranslation();

  const history = useHistory();

  const classes = useStyles();

  const { openWithProps: openBookingsLinkDialog } = useBookingsLinkModal();

  // redirect to customers `bookings` entry flow
  const bookingsRoute = `${Routes.CustomerArea}/${customer?.secretKey}`;
  const redirectToBookings = () => {
    history.push(bookingsRoute);
    onClose();
  };

  const openBookingsLinkModal = (method: SendBookingLinkMethod) => () => {
    openBookingsLinkDialog({
      ...customer,
      method,
    });
  };

  return (
    <div {...{ className }}>
      <Button
        startIcon={<DateRangeIcon />}
        className={classes.actionButton}
        color="primary"
        onClick={redirectToBookings}
        data-testid={__openBookingsId__}
        variant="contained"
      >
        {t(ActionButton.CustomerBookings)}
      </Button>
      <Button
        startIcon={<Mail />}
        className={classes.actionButton}
        color="primary"
        onClick={openBookingsLinkModal(SendBookingLinkMethod.Email)}
        data-testid={__sendBookingsEmailId__}
        variant="contained"
        // disable button if email or secret key not provided
        disabled={!(customer?.email && customer?.secretKey)}
      >
        {t(ActionButton.SendBookingsEmail)}
      </Button>
      <Button
        startIcon={<Phone />}
        className={classes.actionButton}
        color="primary"
        onClick={openBookingsLinkModal(SendBookingLinkMethod.SMS)}
        data-testid={__sendBookingsSMSId__}
        variant="contained"
        // disable button if phone number or secret key not provided
        disabled={!(customer?.phone && customer?.secretKey)}
      >
        {t(ActionButton.SendBookingsSMS)}
      </Button>
    </div>
  );
};

const useBookingsLinkModal = createModal("SendBookingsLinkDialog");

const useStyles = makeStyles((theme) => ({
  actionButton: {
    marginRight: "0.5rem",
    [theme.breakpoints.down("md")]: {
      width: "80%",
      margin: "0.5rem 10%",
    },
    // The following is a workaround to not overrule the Mui base button styles
    // by Tailwind's preflight reset
    backgroundColor: theme.palette.primary.main,
  },
}));

export default ActionButtons;
