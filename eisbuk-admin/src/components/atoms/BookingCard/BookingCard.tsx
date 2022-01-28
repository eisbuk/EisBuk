import React from "react";
import { useTranslation } from "react-i18next";

import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";
import createStyles from "@material-ui/core/styles/createStyles";

import { SlotInterface, SlotInterval, fromISO } from "eisbuk-shared";

import { ActionButton, DateFormat } from "@/enums/translations";

import { BookingCardVariant } from "@/enums/components";

import TypeIcon from "./TypeIcon";
import Duration from "./Duration";

import { __bookingCardId__ } from "@/__testData__/testIds";

export type Props = Pick<SlotInterface, "type"> &
  Pick<SlotInterface, "date"> &
  Pick<SlotInterface, "notes"> & {
    /**
     * Start/end time of an interval
     */
    interval: SlotInterval;
    /**
     * A boolean flag we're using to mark interval which is booked:
     * - controls button label
     * - controls dispatching of the propper booking operation `bookInterval`, `cancelBooking`
     */
    booked?: boolean;
    /**
     * A flag in charge of rendering different variants of `BookingCard` for `calendar` view or `book_ice/book_off_ice`
     */
    variant?: BookingCardVariant;
    /**
     * A boolean flag we're using to fade non booked intervals of a booked slot.
     */
    fade?: boolean;
    /**
     * A boolean flag we're using to disable all buttons while the local/firestore state is syncing.
     */
    disabled?: boolean;
    /**
     * Fires (parent provided) function to book interval
     */
    bookInterval?: () => void;
    /**
     * Cancels booked interval (through the parent component)
     */
    cancelBooking?: () => void;
  };

const BookingCard: React.FC<Props> = ({
  type,
  date: dateISO,
  notes,
  interval,
  bookInterval = () => {},
  cancelBooking = () => {},
  booked,
  fade,
  disabled,
  variant = BookingCardVariant.Booking,
}) => {
  const classes = useStyles();

  const { t } = useTranslation();
  const date = fromISO(dateISO);

  const handleClick = () => (booked ? cancelBooking() : bookInterval());

  /**
   * Date box is shown in `calendar` variant, but hidden in `booking` variant
   * as cards in `booking` view will already be inside date container.
   */
  const dateBox = (
    <Box className={classes.date} textAlign="center">
      <Typography variant="h5" className={classes.weekday}>
        {t(DateFormat.Weekday, { date })}
      </Typography>
      <Typography className={classes.day}>
        {t(DateFormat.Day, { date })}
      </Typography>
      <Typography className={classes.month}>
        {t(DateFormat.Month, { date })}
      </Typography>
    </Box>
  );

  /**
   * Interval timespan and duration icon
   */
  const durationBox = (
    <Box className={classes.durationBox}>
      <Typography className={classes.time} component="h2">
        <strong>{interval.startTime}</strong> - {interval.endTime}
      </Typography>
      <Duration className={classes.durationIcons} {...interval} />
    </Box>
  );

  /**
   * An overlay we're using to achieve fade effect.
   * Comes after the card, but before button (to leave button unfaded)
   */
  const fadeOverlay = <div className={classes.fadeOverlay} />;

  /**
   * Action button for `bookInterval`/`cancelBooking`
   */
  const actionButton = (
    <Button
      disabled={disabled}
      className={classes.actionButton}
      onClick={handleClick}
      color={booked ? "secondary" : "primary"}
      variant="contained"
    >
      {t(booked ? ActionButton.Cancel : ActionButton.BookInterval)}
    </Button>
  );

  return (
    <Card
      variant="outlined"
      data-testid={__bookingCardId__}
      className={classes.root}
    >
      <CardContent className={classes.content}>
        {variant === BookingCardVariant.Calendar && dateBox}
        <Box
          className={[
            classes.innerBox,
            ...(variant === BookingCardVariant.Booking
              ? [classes.bottomPadding]
              : []),
          ].join(" ")}
        >
          {durationBox}
          {notes && (
            <Box className={classes.notesWrapper}>
              <Typography className={classes.notes}>{notes}</Typography>
            </Box>
          )}
          <TypeIcon
            className={
              variant === BookingCardVariant.Booking
                ? classes.bottomLeft
                : classes.bottomRight
            }
            {...{ type }}
          />
        </Box>
      </CardContent>
      {(fade || disabled) && fadeOverlay}
      {variant === BookingCardVariant.Booking && actionButton}
    </Card>
  );
};

const useStyles = makeStyles((theme) =>
  createStyles({
    // #region mainStyles
    root: {
      position: "relative",
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    content: {
      display: "flex",
      flexDirection: "row",
      padding: 0,
      "&:last-child": {
        // Fix for Material-UI defaulting this to 24
        paddingBottom: 0,
      },
    },
    innerBox: {
      position: "relative",
      width: "100%",
      display: "flex",
      alignItems: "stretch",
    },
    actionButton: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: "52%",
      height: "2.25rem",
    },
    fadeOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      opacity: 0.8,
      background: "white",
    },
    // #endregion mainStyles

    // #region dateBoxStyles
    date: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.getContrastText(theme.palette.primary.main),
      padding: theme.spacing(1),
      "& .MuiTypography-root:not(.makeStyles-weekday-20)": {
        lineHeight: 1,
      },
    },
    weekday: {
      textTransform: "uppercase",
      fontSize: theme.typography.pxToRem(20),
      // @ts-expect-error - fontWeightBold has the wrong type for some reason
      fontWeight: theme.typography.fontWeightBold,
    },
    day: {
      fontSize: theme.typography.h2.fontSize,
      // @ts-expect-error - fontWeightBold has the wrong type for some reason
      fontWeight: theme.typography.fontWeightBold,
    },
    month: {
      textTransform: "uppercase",
      fontSize: theme.typography.pxToRem(13),
      // @ts-expect-error - fontWeightBold has the wrong type for some reason
      fontWeight: theme.typography.fontWeightBold,
    },
    // #endregion dateBoxStyles

    // #region durationBoxStyles
    durationBox: {
      height: "100%",
      width: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-evenly",
      alignItems: "center",
      padding: theme.spacing(1),
    },
    time: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      fontSize: theme.typography.h6.fontSize!,
      color: theme.palette.grey[700],
      "& strong": {
        fontSize: theme.typography.h5.fontSize!,
        color: theme.palette.primary.main,
        marginRight: "0.25rem",
      },
    },
    durationIcons: {
      display: "flex",
    },
    // #endregion durationBoxStyles

    // #region notesStyles
    notesWrapper: {
      width: "100%",
      boxSizing: "border-box",
      borderLeft: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1),
    },
    notes: {
      // @ts-expect-error - fontWeightBold has the wrong type for some reason
      fontWeight: theme.typography.fontWeightBold,
    },
    // #endregion notesStyles

    // #region utilClasses
    bottomPadding: {
      paddingBottom: "2.25rem",
    },
    bottomRight: {
      position: "absolute",
      bottom: "0.5rem",
      right: "0.5rem",
    },
    bottomLeft: {
      position: "absolute",
      bottom: "0.5rem",
      left: "2rem",
    },
    // #endregion utilClasses
  })
);

export default BookingCard;
