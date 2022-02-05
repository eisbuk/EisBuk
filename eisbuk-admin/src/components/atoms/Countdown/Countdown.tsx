import React, { useState, useEffect, createElement } from "react";
import { DateTime } from "luxon";

import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  countdownDate: DateTime;
  textColor?: string;
  countdownColor?: string;
  backgroundColor?: string;
  actionButton?: JSX.Element;
  as?: keyof JSX.IntrinsicElements;
}

type CountdownTuple = [number, number, number, number];

const Countdown: React.FC<Props> = ({
  title,
  message,
  countdownDate,
  actionButton = null,
  as = "div",
  textColor = "white",
  backgroundColor = "rgba(255, 0, 0, 0.8)",
  countdownColor,
  className = "",
  ...props
}) => {
  const classes = useStyles();

  const [countdown, setCountdown] = useState<CountdownTuple>([2, 0, 0, 0]);

  useEffect(() => {
    const interval = setTimeout(() => {
      const now = DateTime.fromMillis(Date.now());
      const { days, hours, minutes, seconds } = countdownDate.diff(now, [
        "days",
        "hours",
        "minutes",
        "seconds",
      ]);
      setCountdown([days, hours, minutes, seconds]);
    }, 1000);

    return () => clearTimeout(interval);
  }, [countdown]);

  const countdownString = createCountdownString(countdown);

  return createElement(
    as,
    {
      style: { backgroundColor },
      className: className || classes.container,
      ...props,
    },
    [
      title && (
        <Typography
          variant="h4"
          className={classes.text}
          style={{ color: textColor, fontWeight: "bold" }}
        >
          {title}
        </Typography>
      ),
      message && (
        <Typography
          variant="h6"
          className={classes.text}
          style={{ color: textColor }}
        >
          {message}
        </Typography>
      ),
      <Typography
        className={classes.text}
        style={{ fontWeight: "bold", color: countdownColor || textColor }}
        variant="h4"
      >
        {countdownString}
      </Typography>,
      actionButton,
    ]
  );
};

/**
 * Accepts a tuple of four numbers [days, hours, minutes, seconds]
 * and creates a string in strict format: "dd:hh:mm:ss"
 * @param values
 * @returns {string}
 */
const createCountdownString = (values: CountdownTuple): string =>
  values.map((val) => `0${Math.floor(val)}`.slice(-2)).join(":");

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
}));

export default Countdown;
