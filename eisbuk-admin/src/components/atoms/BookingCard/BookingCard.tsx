import React from "react";

import Box from "@material-ui/core/Box";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/styles/makeStyles";

import { Duration, Slot } from "eisbuk-shared";

import ProjectIcon from "@/components/global/ProjectIcons";

import { currentTheme } from "@/themes";

import { slotsLabels } from "@/config/appConfig";

import { fb2Luxon } from "@/utils/date";
import { useTranslation } from "react-i18next";

export type Props = Pick<Slot, "type"> &
  Pick<Slot, "date"> &
  Pick<Slot, "notes"> & {
    bookedDuration: Duration;
  };

/** @TODO This component needs fixing (rebase), would be best to do if we implement tailwind */
const BookingCard: React.FC<Props> = ({
  type,
  date: timestamp,
  notes,
  bookedDuration,
}) => {
  const classes = useStyles();

  const { t } = useTranslation();
  const slotLabel = slotsLabels.types[type];
  const date = fb2Luxon(timestamp);

  // times to show
  const startTimeISO = date.toISOTime().substring(0, 5);
  const endTimeISO = date
    .plus({ minutes: Number(bookedDuration) - 10 })
    .toISOTime()
    .substring(0, 5);

  const timeSpan = (
    <Box className={classes.time}>
      <Typography component="h2">
        <Typography color="primary" display="inline" variant="h5">
          <strong>{startTimeISO}</strong>
        </Typography>{" "}
        <Typography className={classes.endTime} display="inline" variant="h6">
          - {endTimeISO}
        </Typography>
      </Typography>
    </Box>
  );

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
          <Box display="flex">
            <Box
              display="flex"
              justifyContent="center"
              flexGrow={1}
              className={classes.durationWrapper}
            >
              <Button
                key={bookedDuration}
                color="primary"
                variant="text"
                className={classes.duration}
                disabled
              >
                {slotsLabels.durations[bookedDuration].label}
              </Button>
            </Box>
            <Box
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
  durationWrapper: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  duration: {},
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
