import React from "react";
import { DateTime } from "luxon";

import Box from "@material-ui/core/Box";

import OneHourIcon from "@/assets/images/HourIcon";
import HalfHourIcon from "@/assets/images/HalfHourIcon";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { BookingDuration } from "@/enums/components";
import { Typography } from "@material-ui/core";

interface DurationProps {
  startTime: string;
  endTime: string;
  className?: string;
  color?: string;
}

const Duration: React.FC<DurationProps> = ({
  className,
  startTime,
  endTime,
  color = "black",
}) => {
  const classes = useStyles();

  const intervalDuration = calculateIntervalDuration(startTime, endTime);

  const OneHour = () => (
    <div className={classes.icon}>
      <OneHourIcon />
    </div>
  );

  const HalfHour = () => (
    <div className={classes.icon}>
      <HalfHourIcon />
    </div>
  );

  const TwoPlusHours = () => (
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
    <Box style={{ color }} className={[classes.container, className].join(" ")}>
      {durationComponents[intervalDuration].map((Element, i) => (
        <Element key={`${intervalDuration}-${i}`} />
      ))}
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

  if (minutes < 40) {
    return BookingDuration["0.5h"];
  }
  if (minutes < 70) {
    return BookingDuration["1h"];
  }
  if (minutes < 90) {
    return BookingDuration["1.5h"];
  }
  return BookingDuration["2h"];
};

const useStyles = makeStyles(() => ({
  container: {
    width: "8rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    height: "4rem",
    width: "4rem",
    display: "flex",
    alignItems: "center",
  },
  twoPlus: {
    fontSize: "2rem",
    fontWeight: "bold",
  },
}));

export default Duration;
