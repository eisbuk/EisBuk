import React from "react";

import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotInterface, SlotInterval } from "@/types/temp";

import ProjectIcon from "@/components/global/ProjectIcons";

import { currentTheme } from "@/themes";

import { slotsLabels } from "@/config/appConfig";

import { fb2Luxon } from "@/utils/date";
import { useTranslation } from "react-i18next";

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
     * A boolean flag we're using to fade non booked intervals of a booked slot.
     */
    fade?: boolean;
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
  date: timestamp,
  notes,
  interval,
  bookInterval,
  cancelBooking,
  booked,
}) => {
  const classes = useStyles();

  const { t } = useTranslation();
  const slotLabel = slotsLabels.types[type];
  const date = fb2Luxon(timestamp);

  /**
   * @FOR_FADWA_TASK_1
   * - you need to refactor this to use interval instead of calculating from duration
   * - should be straight forward, no fancy calculations or conversions (the start and end times are already received as `interval` properties as strings)
   */

  const handleClick = () => {
    /**
     * @FOR_FADWA_TASK_2
     * should call proper booking operation (with respect to `booked` flag)
     */
    booked ? cancelBooking() : bookInterval();
  };

  return (
    <Card variant="outlined" className={classes.root}>
      <CardContent className={classes.content}>
        <Box className={classes.date} textAlign="center">
          <Typography variant="h5" className={classes.weekday}>
            {t("CustomerAreaBookingCard.Weekday", { date })}
          </Typography>
          <Typography className={classes.day}>
            {t("CustomerAreaBookingCard.Day", { date })}
          </Typography>
          <Typography className={classes.month}>
            {t("CustomerAreaBookingCard.Month", { date })}
          </Typography>
        </Box>
        <Box display="flex" flexGrow={1} flexDirection="column">
          <Box display="flex" flexGrow={1} className={classes.topWrapper}>
            {interval.startTime - interval.endTime}
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
          <Box display="flex">
            <Box
              className={classes.split}
              flexGrow={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
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
                {t(`SlotTypes.${type}`)}
              </Typography>
            </Box>
            <Box
              className={classes.split}
              display="flex"
              justifyContent="center"
              flexGrow={1}
            >
              <Button
                className={classes.actionButton}
                onClick={handleClick}
                color="secondary"
                variant="contained"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ***** Region Styles ***** //
type Theme = typeof currentTheme;

const useStyles = makeStyles((theme: Theme) => ({
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
  split: {
    diaplay: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "50%",
    height: "100%",
  },
  topWrapper: { borderBottom: `1px solid ${theme.palette.divider}` },
  time: {
    padding: theme.spacing(1.5),
  },
  notesWrapper: {
    borderLeft: `1px solid ${theme.palette.divider}`,
    paddingLeft: theme.spacing(1),
  },
  notes: {
    fontWeight: theme.typography.fontWeightLight,
  },
  endTime: {
    color: theme.palette.grey[700],
  },
  typeIcon: {
    opacity: 0.5,
  },
  type: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
  },
  actionButton: {
    width: "100%",
    height: "100%",
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
// ***** End Region Styles ***** //

export default BookingCard;
