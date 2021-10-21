import React, { useState } from "react";

import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { CustomerWithAttendance } from "@/types/components";

import EisbukAvatar from "@/components/users/EisbukAvatar";
import IntervalPicker from "./IntervalPicker";

import useDebounce from "@/hooks/useDebounce";

import { ETheme } from "@/themes";

import { __attendanceButton__ } from "./__testData__/testIds";

interface Props extends CustomerWithAttendance {
  /**
   * List of intervals to choose from
   */
  intervals: string[];
  /**
   * Function used to mark customer as having attended appropriate interval
   */
  markAttendance: (payload: { attendedInterval: string }) => void;
  /**
   * Function used to mark customer as absent
   */
  markAbsence: () => void;
}

/**
 * User attendance card component. Used to display and update customer attendance.
 * Should recieve all data through props, while marking attendance dispatches
 * updates to the firestore (through Redux) and provides some UX boundaries such as debounced updates (to prevent excess calls to the server)
 * and disabling buttons while the states are syncing.
 */
const UserAttendance: React.FC<Props> = ({
  bookedInterval,
  attendedInterval,
  intervals,
  markAttendance,
  markAbsence,
  ...customer
}) => {
  const classes = useStyles();
  const listItemClass = [
    classes.listItem,
    attendedInterval ? "" : classes.absent,
  ].join(" ");

  /**
   * Local (boolean) state for attended/absent.
   * We're using this to change attendance button's icon immediately
   * and disable the button until attendance state is synced with the db.
   */
  const [localAttended, setLocalAttended] = useState<boolean>(
    Boolean(attendedInterval)
  );

  const [selectedInterval, setSelectedInterval] = useState<string>(
    attendedInterval || bookedInterval!
  );

  /**
   * Debounced version of `markAttendance`. Used to prevent excess server requests
   * when switching through the intervals
   * (only fire `markAttendance` when user stops clicking through the interval picker).
   */
  const debMarkAttendance = useDebounce(markAttendance, 800);

  /**
   * Attendance button click handler:
   * - updates `localAttended` immediately (for more responsive UI)
   * - dispatches `markAttendance`/`markAbsence` to firestore (according to current state)
   * - if dispatching `markAttendance`, uses last remembered interval (or booked interval) as `attendedInterval` value
   */
  const handleClick = () => {
    const newAttended = !attendedInterval;
    setLocalAttended(newAttended);
    if (newAttended) {
      markAttendance({ attendedInterval: selectedInterval });
    } else {
      markAbsence();
    }
  };

  /**
   * Interval picker change handler:
   * - updates `selectedInterval` locally (for more responsive UI)
   * - updates `attendedInterval` (in firesore), through debounced `markAttendance` function.s
   * @param value
   */
  const handleIntervalChange = (value: string) => {
    setSelectedInterval(value);
    debMarkAttendance({ attendedInterval: value });
  };

  /**
   * We're disabling attendance button while `localAttended` (boolean) syncs with state in firestore (`attendedInterval !== null`)
   * and when switchig through intervals -> `selectedInterval` and `attendedInterval` (from firestore) are not the same
   * the second doesn't apply if `attendedInterval = null` (as that would cause problems and isn't exactly expected behavior).
   */
  const disableButton =
    localAttended !== Boolean(attendedInterval) ||
    Boolean(attendedInterval && attendedInterval !== selectedInterval);

  const attendanceButton = "👍";
  const absenceButton = bookedInterval ? "👎" : "🗑️";
  const attendnaceControl = (
    <div className={classes.actionsContainer}>
      <IntervalPicker
        disabled={!localAttended}
        intervals={intervals}
        value={selectedInterval}
        onChange={handleIntervalChange}
      />
      <Button
        data-testid={__attendanceButton__}
        variant="contained"
        size="small"
        color={localAttended ? "primary" : "secondary"}
        onClick={handleClick}
        disabled={disableButton}
      >
        {localAttended ? attendanceButton : absenceButton}
      </Button>
    </div>
  );

  return (
    <ListItem className={listItemClass}>
      <ListItemAvatar>
        <EisbukAvatar {...customer} />
      </ListItemAvatar>
      <ListItemText primary={customer.name} />
      <ListItemSecondaryAction>{attendnaceControl}</ListItemSecondaryAction>
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
  listItem: {
    padding: theme.spacing(1),
  },
  actionsContainer: {
    minWidth: 120,
    display: "flex",
    flexDirection: "row",
  },
}));
// #endregion Styles
export default UserAttendance;
