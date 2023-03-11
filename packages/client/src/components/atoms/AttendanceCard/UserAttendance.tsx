import React, { useState, useEffect } from "react";
import { AttendanceAria, useTranslation } from "@eisbuk/translations";
import { Link } from "react-router-dom";

import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import makeStyles from "@mui/styles/makeStyles";

import { PrivateRoutes } from "@/enums/routes";

import { CustomerWithAttendance } from "@/types/components";

import EisbukAvatar from "@/components/users/EisbukAvatar";
import IntervalPicker from "./IntervalPicker";

import useDebounce from "@/hooks/useDebounce";

import { ETheme } from "@/themes";

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

  // In an edge case of some other client (browser or different browser window)
  // updates the booked interval (or boolean attendance state) we wish to reflect that
  // update locally as well
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

  // We're disabling attendance button while `localAttended` (boolean) syncs with state in firestore (`attendedInterval !== null`)
  // and when switchig through intervals -> `selectedInterval` and `attendedInterval` (from firestore) are not the same
  // the second doesn't apply if `attendedInterval = null` (as that would cause problems and isn't exactly expected behavior).
  const disableButton =
    localAttended !== Boolean(attendedInterval) ||
    Boolean(attendedInterval && attendedInterval !== selectedInterval);

  const isAbsent = !attendedInterval;
  const backgroundColor = isAbsent ? classes.bgAbsent : classes.bgWhite;
  const shadowColor = isAbsent ? classes.shadowAbsent : classes.shadowWhite;

  // Container setup
  const listItemClass = [
    classes.container,
    backgroundColor,
    customer.deleted ? classes.deleted : "",
  ].join(" ");

  // Avatar/name setup
  const customerString = [
    `${customer.name} ${customer.surname}`,
    customer.deleted ? `(${t("Flags.Deleted")})` : "",
  ]
    .join(" ")
    .trim();

  // Interval picker setup
  const intervalContainerClasses = [
    classes.intervalContainer,
    backgroundColor,
    shadowColor,
  ].join(" ");

  // Attendance button setup
  const attendanceButton = bookedInterval ? "👍" : "🗑️";
  const absenceButton = "👎";
  const buttonContainerClasses = [
    classes.buttonContainer,
    backgroundColor,
    shadowColor,
  ].join(" ");
  const buttonClasses = [
    !bookedInterval
      ? classes.trashCan
      : localAttended
      ? classes.attendedButton
      : classes.absentButton,
    classes.button,
  ].join(" ");

  return (
    <Link to={`${PrivateRoutes.Athletes}/${customer.id}`}>
      <ListItem style={{}} className={listItemClass}>
        <div className={classes.avatarContainer}>
          <EisbukAvatar {...customer} />
          <Typography style={{ margin: "0 0.75rem" }}>
            {customerString}
          </Typography>
        </div>
        <div className={buttonContainerClasses}>
          <Button
            className={buttonClasses}
            aria-label={
              localAttended
                ? t(AttendanceAria.MarkAbsent)
                : t(AttendanceAria.MarkPresent)
            }
            variant="contained"
            size="small"
            onClick={handleClick}
            disabled={disableButton}
            style={{ justifySelf: "end" }}
          >
            {localAttended ? attendanceButton : absenceButton}
          </Button>
        </div>
        <div className={intervalContainerClasses}>
          <IntervalPicker
            disabled={!localAttended}
            intervals={intervals}
            attendedInterval={selectedInterval}
            bookedInterval={bookedInterval}
            onChange={handleIntervalChange}
            style={{ justifySelf: "center" }}
          />
        </div>
      </ListItem>
    </Link>
  );
};

// #region Styles
const useStyles = makeStyles((theme: ETheme) => ({
  // Blocks
  container: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    [theme.breakpoints.up("sm")]: {
      flexDirection: "row",
      flexWrap: "nowrap",
      justifyContent: "space-between",
    },
  },
  avatarContainer: {
    margin: theme.spacing(1),
    display: "flex",
    width: "100%",
    justifyContent: "start",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  intervalContainer: {
    display: "flex",
    width: "100%",
    justifyContent: "center",
    [theme.breakpoints.up("sm")]: {
      width: "auto",
      position: "absolute",
      right: "6rem",
    },
    margin: theme.spacing(1),
  },
  buttonContainer: {
    position: "absolute",
    top: "0.75rem",
    right: "1.5rem",
    height: "2.75rem",
  },
  button: {
    height: "2.75rem",
  },

  // Colors
  bgAbsent: {
    backgroundColor: theme.palette.absent || theme.palette.grey[500],
  },
  bgWhite: {
    backgroundColor: "#FFFF",
  },
  shadowWhite: {
    boxShadow: "0 4px 8px 12px white",
  },
  shadowAbsent: {
    boxShadow: `0 4px 8px 12px ${theme.palette.absent}`,
  },
  deleted: {
    opacity: 0.5,
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
}));
// #endregion Styles
export default UserAttendance;
