import React from "react";
import { DateTime } from "luxon";

import Box from "@material-ui/core/Box";

import OneHourIcon from "@/assets/images/hour.svg";
import HalfHourIcon from "@/assets/images/half-hour.svg";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { BookingDuration } from "@/enums/components";
import { Typography } from "@material-ui/core";

interface DurationProps {
  startTime: string;
  endTime: string;
  className?: string;
}

const Duration: React.FC<DurationProps> = ({
  className,
  startTime,
  endTime,
}) => {
  const classes = useStyles();

  const intervalDuration = calculateIntervalDuration(startTime, endTime);

  const OneHour = (
    <div className={[classes.icon, classes.oneHour].join(" ")}>
      <OneHourIcon />
    </div>
  );

  const HalfHour = (
    <div className={[classes.icon, classes.halfHour].join(" ")}>
      <HalfHourIcon />
    </div>
  );

  const TwoPlusHours = (
    <Typography className={[classes.icon, classes.twoPlus].join(" ")}>
      {BookingDuration["2+h"]}
    </Typography>
  );

  const durationComponents = {
    [BookingDuration["0.5h"]]: [HalfHour],
    [BookingDuration["1h"]]: [OneHour],
    [BookingDuration["1.5h"]]: [OneHour, HalfHour],
    [BookingDuration["2h"]]: [OneHour, OneHour],
    [BookingDuration["2+h"]]: [TwoPlusHours],
  };

  return (
    <Box {...{ className }}>
      {durationComponents[intervalDuration].map((el) => el)}
    </Box>
  );
};

export const calculateIntervalDuration = (
  startTime: string,
  endTime: string
): BookingDuration => {
  const luxonStart = DateTime.fromISO(startTime);
  const luxonEnd = DateTime.fromISO(endTime);
  const { minutes } = luxonEnd.diff(luxonStart, ["minutes"]);

  // exit early with catch all if duration greater than expected
  if (minutes > 120) return BookingDuration["2+h"];

  const roundedMinutes = Math.round(minutes / 30) * 30;

  switch (roundedMinutes) {
    case 60:
      return BookingDuration["1h"];
    case 90:
      return BookingDuration["1.5h"];
    case 120:
      return BookingDuration["2h"];
    default:
      // should not happen in production
      return BookingDuration["0.5h"];
  }
};

const useStyles = makeStyles((theme) => ({
  icon: {
    height: "3rem",
    width: "3rem",
  },
  oneHour: {
    color: "#98BF0F",
  },
  halfHour: {
    color: "#98BF0F",
  },
  twoPlus: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: theme.palette.error.main,
  },
}));

export default Duration;
