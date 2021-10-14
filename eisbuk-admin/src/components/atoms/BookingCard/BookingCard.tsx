import React from "react";
import { useTranslation } from "react-i18next";

import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotInterface, SlotInterval, fromISO } from "eisbuk-shared";

import {
  __bookInterval__,
  __cancelBooking__,
  slotTypeLabel,
  DateFormat,
} from "@/lib/labels";

import { slotsLabels } from "@/config/appConfig";

import { BookingCardVariant } from "@/enums/components";

import ProjectIcon from "@/components/global/ProjectIcons";

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
  const slotLabel = slotsLabels.types[type];
  const date = fromISO(dateISO);

  const handleClick = () => (booked ? cancelBooking() : bookInterval());

  console.log("ISO date > ", dateISO);
  console.log("Weekday > ", date.toFormat("EEE"));
  console.log("Day > ", date.toFormat("d"));
  console.log("Month > ", date.toFormat("MMMM"));

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

  const timeSpan = (
    <Typography
      className={[classes.time, classes.flexCenter, classes.boxCenter].join(
        " "
      )}
      component="h2"
    >
      <strong>{interval.startTime}</strong> - {interval.endTime}
    </Typography>
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
      {t(booked ? __cancelBooking__ : __bookInterval__)}
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
        <Box display="flex" flexGrow={1} flexDirection="column">
          <Box display="flex" flexGrow={1} className={classes.topWrapper}>
            {timeSpan}
            {notes && (
              <Box
                display="flex"
                className={classes.notesWrapper}
                alignItems="center"
              >
                <Typography className={classes.notes}>{notes}</Typography>
              </Box>
            )}
          </Box>
          <Box className={classes.bottomBox}>
            <Box
              className={[
                classes.flexCenter,
                classes.typeLabel,
                variant === BookingCardVariant.Booking
                  ? classes.boxLeft
                  : classes.boxCenter,
              ].join(" ")}
              flexGrow={1}
              pl={1}
              pr={1}
            >
              <ProjectIcon
                className={classes.typeIcon}
                icon={slotLabel.icon}
                fontSize="small"
              />
              <Typography
                className={classes.type}
                key="type"
                color={slotLabel.color}
              >
                {t(slotTypeLabel[type])}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
      {(fade || disabled) && fadeOverlay}
      {variant === BookingCardVariant.Booking && actionButton}
    </Card>
  );
};

// #region styles

const useStyles = makeStyles((theme) => ({
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
  date: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.getContrastText(theme.palette.primary.main),
    padding: theme.spacing(1),
    "& .MuiTypography-root:not(.makeStyles-weekday-20)": {
      lineHeight: 1,
    },
  },
  bottomBox: {
    height: "2.25rem",
  },
  flexCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  typeLabel: {
    height: "100%",
  },
  boxCenter: {
    width: "100%",
  },
  boxLeft: {
    boxSizing: "border-box",
    width: "50%",
    marginRight: "auto",
  },
  topWrapper: { borderBottom: `1px solid ${theme.palette.divider}` },
  time: {
    boxSizing: "border-box",
    padding: theme.spacing(1.5),
    fontSize: theme.typography.h6.fontSize!,
    color: theme.palette.grey[700],
    "& strong": {
      fontSize: theme.typography.h5.fontSize!,
      color: theme.palette.primary.main,
      marginRight: "0.25rem",
    },
  },
  notesWrapper: {
    borderLeft: `1px solid ${theme.palette.divider}`,
    paddingLeft: theme.spacing(1),
    width: "100%",
  },
  notes: {
    fontWeight: theme.typography.fontWeightLight,
  },
  typeIcon: {
    opacity: 0.5,
  },
  type: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
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
  actionButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: "50%",
    height: "2.25rem",
  },
  weekday: {
    textTransform: "uppercase",
    fontSize: theme.typography.pxToRem(20),
    fontWeight: theme.typography.fontWeightBold,
  },
  day: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.fontWeightLight,
  },
  month: {
    textTransform: "uppercase",
    fontSize: theme.typography.pxToRem(13),
    fontWeight: theme.typography.fontWeightBold,
  },
  deleteButton: {},
}));

// #endregion styles

export default BookingCard;
