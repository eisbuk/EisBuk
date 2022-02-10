import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getFunctions, httpsCallable } from "@firebase/functions";
import { getApp } from "@firebase/app";
import { DateTime } from "luxon";

import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { Prompt, ActionButton, BookingCountdown } from "@/enums/translations";
import { CloudFunction } from "@/enums/functions";

import Countdown from "@/components/atoms/Countdown";
import ConfirmDialog from "@/components/global/ConfirmDialog";

import { getBookingsCustomer } from "@/store/selectors/bookings";

import { getOrganization } from "@/lib/getters";
import { getSecretKey } from "@/utils/localStorage";

export interface BookingsCountdownProps {
  message: BookingCountdown;
  deadline: DateTime;
  month: DateTime;
}

const BookingsCountdownComponent: React.FC<BookingsCountdownProps> = ({
  message,
  month,
  deadline,
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const { id } = useSelector(getBookingsCustomer) || {};
  const secretKey = getSecretKey();

  const [finalizeBookings, setFinalizeBookings] = useState(false);
  const [isBookingFinalized, setIsBookingFinalized] = useState(false);

  const countdownMessage = message && t(message, { month });

  const handleFinalize = async () => {
    await httpsCallable(
      getFunctions(getApp(), "europe-west6"),
      CloudFunction.FinalizeBookings
    )({ organization: getOrganization(), id, secretKey });
    setIsBookingFinalized(true);
  };

  const dialogTitle = t(Prompt.FinalizeBookingsTitle);
  const dialogMessage = t(Prompt.ConfirmFinalizeBookings, { month });
  const finalizeButton = (
    <Button
      variant="contained"
      className={classes.finalizeButton}
      disabled={isBookingFinalized}
      onClick={() => setFinalizeBookings(true)}
    >
      {t(ActionButton.FinalizeBookings)}
    </Button>
  );

  return (
    <>
      <Countdown
        message={countdownMessage}
        countdownDate={deadline}
        {...countdownStylesLookup[message]}
        actionButton={
          message === BookingCountdown.SecondDeadline
            ? finalizeButton
            : undefined
        }
      />
      <ConfirmDialog
        open={finalizeBookings}
        setOpen={setFinalizeBookings}
        onConfirm={handleFinalize}
        title={dialogTitle}
      >
        {dialogMessage}
      </ConfirmDialog>
    </>
  );
};

const countdownStylesLookup: Record<
  BookingCountdown,
  Partial<Parameters<typeof Countdown>[0]>
> = {
  [BookingCountdown.FirstDeadline]: {
    backgroundColor: "yellow",
    textColor: "black",
  },
  [BookingCountdown.SecondDeadline]: {
    backgroundColor: "red",
    textColor: "white",
  },
};

const useStyles = makeStyles(() => ({
  finalizeButton: {
    margin: "0.25rem 0",
    backgroundColor: "#212121",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#000000",
    },
  },
}));

export default BookingsCountdownComponent;
