import React, { useState } from "react";
import { useSelector } from "react-redux";
import { getFunctions, httpsCallable } from "@firebase/functions";
import { getApp } from "@firebase/app";
import { DateTime } from "luxon";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import makeStyles from "@mui/styles/makeStyles";

import {
  useTranslation,
  Prompt,
  ActionButton,
  BookingCountdownMessage,
} from "@eisbuk/translations";

import { CloudFunction } from "@/enums/functions";

import ConfirmDialog from "@/components/global/ConfirmDialog";

import useCountdown from "@/hooks/useCountdown";

import { getBookingsCustomer } from "@/store/selectors/bookings";

import { getOrganization } from "@/lib/getters";
import { getSecretKey } from "@/utils/localStorage";

export interface BookingsCountdownProps {
  message: BookingCountdownMessage;
  deadline: DateTime | null;
  month: DateTime;
  // we're lifting the state of locally finalized booking
  // to be able to disable 'finalize' buttons on multiple instances of the component
  isBookingFinalized?: boolean;
  setIsBookingFinalized?: (isFinalized: boolean) => void;
}

const BookingsCountdown: React.FC<BookingsCountdownProps> = ({
  message,
  month,
  deadline,
  isBookingFinalized,
  setIsBookingFinalized = () => {},
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const { id } = useSelector(getBookingsCustomer) || {};
  const secretKey = getSecretKey();

  // countdown flow
  const countdown = useCountdown(deadline, "hour");
  const countdownMessage = t(message, {
    ...(countdown
      ? // bookings locked message (no deadline, no countdown) doesn't accept any props
        {
          days: countdown.days,
          hours: countdown.hours,
          date: deadline,
          month: month,
        }
      : { month }),
  });

  // finalize bookings flow
  const [finalizeBookings, setFinalizeBookings] = useState(false);

  const handleFinalize = async () => {
    setIsBookingFinalized(true);
    await httpsCallable(
      getFunctions(getApp(), "europe-west6"),
      CloudFunction.FinalizeBookings
    )({ organization: getOrganization(), id, secretKey });
  };

  const dialogTitle = t(Prompt.FinalizeBookingsTitle);
  const dialogMessage = t(Prompt.ConfirmFinalizeBookings, { month });

  return (
    <div style={countdownStylesLookup[message]} className={classes.container}>
      <Typography
        variant="h6"
        className={classes.text}
        // there are "<strong>" tags as part of a countdown message
        // hence the `dangerouslySetInnerHtml`
        dangerouslySetInnerHTML={{ __html: countdownMessage }}
      />

      {message === BookingCountdownMessage.SecondDeadline && (
        <Button
          variant="contained"
          className={classes.finalizeButton}
          disabled={isBookingFinalized}
          onClick={() => setFinalizeBookings(true)}
        >
          {t(ActionButton.FinalizeBookings)}
        </Button>
      )}

      <ConfirmDialog
        open={finalizeBookings}
        setOpen={setFinalizeBookings}
        onConfirm={handleFinalize}
        title={dialogTitle}
      >
        {dialogMessage}
      </ConfirmDialog>
    </div>
  );
};

const countdownStylesLookup = {
  [BookingCountdownMessage.FirstDeadline]: {
    backgroundColor: "yellow",
    color: "black",
  },
  [BookingCountdownMessage.SecondDeadline]: {
    backgroundColor: "red",
    color: "white",
  },
};

const useStyles = makeStyles(() => ({
  container: {
    padding: "1rem",
    border: "none",
    borderRadius: "0.375rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  text: {
    padding: "0.25rem 0",
    maxWidth: "60rem",
    textAlign: "center",
  },
  finalizeButton: {
    margin: "0.25rem 0",
    backgroundColor: "#212121",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#000000",
    },
  },
}));

export default BookingsCountdown;
