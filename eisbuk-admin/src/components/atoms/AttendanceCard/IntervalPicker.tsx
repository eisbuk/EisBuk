import React from "react";

import ButtonGroup from "@material-ui/core/ButtonGroup";
import IconButton from "@material-ui/core/Button";

import Left from "@material-ui/icons/ChevronLeft";
import Right from "@material-ui/icons/ChevronRight";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { ETheme } from "@/themes";

import {
  __nextIntervalButtonId__,
  __prevIntervalButtonId__,
} from "./__testData__/testIds";

interface Props {
  intervals: string[];
  onChange: (attendedInterval: string) => void;
  attendedInterval: string;
  bookedInterval: string | null;
  disabled?: boolean;
}

const IntervalPicker: React.FC<Props> = ({
  intervals,
  bookedInterval,
  attendedInterval,
  disabled,
  onChange,
}) => {
  const classes = useStyles();

  // get place of current interval in intervals array
  // used to disable prev/next buttons for first/last interval respectively
  const intervalIndex = intervals.findIndex(
    (interval) => interval === attendedInterval
  );
  const numIntervals = intervals.length;

  /**
   * Serves as `onChange` handler only without internal state.
   * Navigates left/right through interval selection
   * @param increment `-1` for previous, `1` for next
   */
  const handleClick = (increment: -1 | 1) => () => {
    const newIndex = intervalIndex + increment;
    onChange(intervals[newIndex]);
  };

  // intervals to display
  const primaryInterval = attendedInterval;
  const secondaryInterval =
    bookedInterval !== attendedInterval ? bookedInterval : null;

  return (
    <ButtonGroup className={classes.container} disabled={disabled}>
      <IconButton
        onClick={handleClick(-1)}
        disabled={intervalIndex === 0}
        data-testid={__prevIntervalButtonId__}
      >
        <Left />
      </IconButton>
      <div className={classes.intervalContainer}>
        {secondaryInterval && (
          <div className={classes.secondary}>
            <span>{secondaryInterval}</span>
            <div className={classes.strikeThrough} />
          </div>
        )}
        <span className={classes.primary}>{primaryInterval}</span>
      </div>
      <IconButton
        onClick={handleClick(1)}
        disabled={intervalIndex === numIntervals - 1}
        data-testid={__nextIntervalButtonId__}
      >
        <Right />
      </IconButton>
    </ButtonGroup>
  );
};

const useStyles = makeStyles((theme: ETheme) => ({
  container: {
    display: "flex",
    alignItems: "stretch",
    width: "12.5rem",
  },
  intervalContainer: {
    position: "relative",
    width: "100%",
    border: "1px solid grey",
  },
  secondary: {
    color: "red",
    position: "absolute",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "14px",
    background: "white",
    boxShadow:
      "-4px 8px 0px 4px rgba(255, 255, 255, 1), 4px 8px 0px 4px rgba(255, 255, 255, 1)",
  },
  strikeThrough: {
    postion: "absolute",
    left: "50%",
    // top: "50%",
    transform: "translate(-50%, -50%)",
    width: "120%",
    height: "1px",
    background: "red",
  },
  primary: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontFamily: theme.typography.h1.fontFamily,
    fontSize: "20px",
  },
}));

export default IntervalPicker;
