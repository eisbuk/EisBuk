import React from "react";

import ButtonGroup from "@material-ui/core/ButtonGroup";
import IconButton from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import Left from "@material-ui/icons/ChevronLeft";
import Right from "@material-ui/icons/ChevronRight";

import makeStyles from "@material-ui/core/styles/makeStyles";

import {
  __nextIntervalButtonId__,
  __prevIntervalButtonId__,
} from "./__testData__/testIds";

interface Props {
  intervals: string[];
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}

const IntervalPicker: React.FC<Props> = ({
  intervals,
  value,
  disabled,
  onChange,
}) => {
  const classes = useStyles();

  // get place of current interval in intervals array
  // used to disable prev/next buttons for first/last interval respectively
  const intervalIndex = intervals.findIndex((interval) => interval === value);
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

  return (
    <ButtonGroup className={classes.container} disabled={disabled}>
      <IconButton
        onClick={handleClick(-1)}
        disabled={intervalIndex === 0}
        data-testid={__prevIntervalButtonId__}
      >
        <Left />
      </IconButton>
      <TextField disabled={true} size="small" {...{ value }} />
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

const useStyles = makeStyles(() => ({
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    width: "12.5rem",
  },
}));

export default IntervalPicker;
