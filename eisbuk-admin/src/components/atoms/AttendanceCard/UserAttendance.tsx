import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const classes = useStyles();
  const listItemClass = [
    classes.listItem,
    attendedInterval ? "" : classes.absent,
    customer.deleted ? classes.deleted : "",
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
   * In an edge case of some other client (browser or different browser window)
   * updates the booked interval (or boolean attendance state) we wish to reflect that
   * update locally as well
   */
  useEffect(() => {
    if (attendedInterval) {
      setSelectedInterval(attendedInterval);
      setLocalAttended(true);
    } else {
      setSelectedInterval(bookedInterval!);
      setLocalAttended(false);
    }
  }, [attendedInterval]);

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
      if (bookedInterval) {
        setSelectedInterval(bookedInterval!);
      }
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

  const attendanceButton = bookedInterval ? "👍" : "🗑️";
  const absenceButton = "👎";
  const buttonClass = [
    !bookedInterval
      ? classes.trashCan
      : localAttended
      ? classes.attendedButton
      : classes.absentButton,
    classes.button,
  ].join(" ");

  const attendnaceControl = (
    <div className={classes.actionsContainer}>
      <IntervalPicker
        disabled={!localAttended}
        intervals={intervals}
        attendedInterval={selectedInterval}
        bookedInterval={bookedInterval}
        onChange={handleIntervalChange}
      />
      <Button
        className={buttonClass}
        data-testid={__attendanceButton__}
        variant="contained"
        size="small"
        onClick={handleClick}
        disabled={disableButton}
      >
        {localAttended ? attendanceButton : absenceButton}
      </Button>
    </div>
  );

  const customerString = [
    `${customer.name} ${customer.surname}`,
    customer.deleted ? `(${t("Flags.Deleted")})` : "",
  ]
    .join(" ")
    .trim();

  return (
    <ListItem className={listItemClass}>
      <ListItemAvatar className={classes.avatarContainer}>
        <EisbukAvatar {...customer} />
      </ListItemAvatar>
      <ListItemText primary={customerString} />
      <ListItemSecondaryAction>{attendnaceControl}</ListItemSecondaryAction>
    </ListItem>
  );
};

// #region Styles
const useStyles = makeStyles((theme: ETheme) => ({
  avatarContainer: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "block",
    },
  },
  absent: {
    backgroundColor: theme.palette.absent || theme.palette.grey[500],
  },
  button: {
    marginLeft: "1.5rem",
    [theme.breakpoints.up("md")]: {
      marginLeft: "none",
    },
  },
  trashCan: {
    background: "rgba(0, 0, 0, 0.1)",
  },
  attendedButton: {
    background: theme.palette.primary.main,
  },
  absentButton: {
    background: theme.palette.secondary.main,
  },
  listItem: {
    padding: theme.spacing(1),
  },
  actionsContainer: {
    minWidth: 120,
    display: "flex",
    flexDirection: "row",
  },
  deleted: {
    opacity: 0.5,
  },
}));
// #endregion Styles
export default UserAttendance;
