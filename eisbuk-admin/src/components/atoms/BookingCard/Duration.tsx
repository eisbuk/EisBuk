import React from "react";
import { DateTime } from "luxon";

import Box from "@material-ui/core/Box";

import OneHourIcon from "@/assets/images/hour.svg";
import HalfHourIcon from "@/assets/images/half-hour.svg";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { BookingDuration } from "@/enums/components";

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

  const durationComponents = {
    [BookingDuration["0.5h"]]: [HalfHour],
    [BookingDuration["1h"]]: [OneHour],
    [BookingDuration["1.5h"]]: [OneHour, HalfHour],
    [BookingDuration["2h"]]: [OneHour, OneHour],
    [BookingDuration["2+h"]]: [OneHour, OneHour],
  };

  return (
    <Box {...{ className }}>
      {durationComponents[intervalDuration].map((el) => el)}
    </Box>
  );
};

const calculateIntervalDuration = (
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

const useStyles = makeStyles(() => ({
  icon: {
    height: "2rem",
    width: "2rem",
  },
  oneHour: {
    color: "green",
  },
  halfHour: {
    color: "red",
  },
}));

export default Duration;
