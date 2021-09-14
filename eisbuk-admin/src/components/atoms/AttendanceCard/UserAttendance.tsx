import React, { useState } from "react";
import { useDispatch } from "react-redux";

import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { CustomerWithAttendance, SlotInterface } from "@/types/temp";

import EisbukAvatar from "@/components/users/EisbukAvatar";

import { ETheme } from "@/themes";
import { __attendanceButton__ } from "./__testData__/testIds";
import IntervalPicker from "./IntervalPicker";

interface Props extends CustomerWithAttendance {
  intervals: SlotInterface["intervals"];
  markAttendance: (payload: { attendedInterval: string }) => void;
  markAbsence: () => void;
}

const UserAttendance: React.FC<Props> = ({
  bookedInterval,
  attendedInterval,
  intervals,
  markAttendance,
  markAbsence,
  ...customer
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const [localAttended, setLocalAttended] = useState<boolean>(
    Boolean(attendedInterval)
  );

  // intervals we're using to control interval picker
  const orderedIntervals = Object.keys(intervals).sort((a, b) =>
    a < b ? -1 : 1
  );
  const [selectedInterval, setSelectedInterval] = useState<string>(
    attendedInterval || bookedInterval!
  );

  const listItemClass = attendedInterval ? "" : classes.absent;

  const handleClick = () => {
    const newAttended = !attendedInterval;
    setLocalAttended(newAttended);
    dispatch(
      newAttended
        ? markAttendance({ attendedInterval: selectedInterval })
        : markAbsence()
    );
  };
  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value);
    markAttendance({ attendedInterval: value });
  };

  const absenteeButtons = (
    <FormControl className={classes.formControl}>
      <InputLabel>Intervals</InputLabel>
      <IntervalPicker
        disabled={!localAttended}
        intervals={orderedIntervals}
        value={selectedInterval}
        onChange={handleIntervalChange}
      />
      <Button
        data-testid={__attendanceButton__}
        variant="contained"
        size="small"
        color={localAttended ? "primary" : "secondary"}
        onClick={handleClick}
        disabled={localAttended !== Boolean(attendedInterval)}
      >
        {localAttended ? "👍" : "👎"}
      </Button>
    </FormControl>
  );

  return (
    <ListItem className={listItemClass}>
      <ListItemAvatar>
        <EisbukAvatar {...customer} />
      </ListItemAvatar>
      <ListItemText primary={customer.name} />
      <ListItemSecondaryAction>{absenteeButtons}</ListItemSecondaryAction>
    </ListItem>
  );
};

// #region Styles
const useStyles = makeStyles((theme: ETheme) => ({
  absent: {
    backgroundColor: theme.palette.absent || theme.palette.grey[500],
  },
  button: {
    display: "block",
    marginTop: theme.spacing(2),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
    display: "flex",
    flexDirection: "row",
  },
}));
// #endregion Styles
export default UserAttendance;
