import React from "react";
import { fb2Luxon } from "@/utils/date";
import { markAttendance } from "@/store/actions/attendanceOperations";
import { useDispatch } from "react-redux";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";
import _ from "lodash";

import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";

import { grey } from "@material-ui/core/colors";
import makeStyles from "@material-ui/core/styles/makeStyles";

import {
  Slot,
  Customer,
  BookingInfo,
  BookingsMeta,
  Duration,
  Category,
  SlotType,
} from "eisbuk-shared";

import { ETheme } from "@/themes";

import EisbukAvatar from "@/components/users/EisbukAvatar";

import { slotsLabels } from "@/config/appConfig";
// eslint-disable-next-line @typescript-eslint/no-empty-interface
type UserBooking = BookingsMeta & Pick<Customer, "certificateExpiration">;

interface Props extends Slot<"id"> {
  userBookings: UserBooking[];
  absentees?: string[];
}

// mark attendees
const AttendanceCard: React.FC<Props> = ({
  date,
  durations,
  categories,
  userBookings,
  absentees,
  id,
  type,
}) => {
  const dispatch = useDispatch();

  const classes = useStyles();
  const { t } = useTranslation();
  // convert timestamp to luxon for easier processing
  const luxonStart = fb2Luxon(date);

  // convert durations to number values
  const durationNumbers = durations.map((duration) => Number(duration));
  const longestDuration = Math.max(...durationNumbers);

  // get end time of longest duration (we're still using durations here, so it's pretty straightforward)
  const luxonEnd = luxonStart.plus({ minutes: longestDuration });

  // get time for rendering
  const startTime = luxonStart.toISOTime().substring(0, 5);
  const endTime = luxonEnd.toISOTime().substring(0, 5);

  const timeString = `${startTime} - ${endTime}`;

  return (
    <Container maxWidth="sm">
      <List className={classes.root}>
        <div data-testid="time-string">{timeString}</div>
        <div>{categories}</div>
        {userBookings.map((user) => {
          const isAbsent = absentees?.includes(user.customer_id) || false;
          const listItemClass = isAbsent ? classes.absent : "";

          const absenteeButtons = (
            <Button
              variant="contained"
              size="small"
              color={isAbsent ? "primary" : "secondary"}
              onClick={() =>
                dispatch(markAttendance(user.customer_id, isAbsent))
              }
              // disabled={hasLocalChange}
            >
              {isAbsent ? "👎" : "👍"}
            </Button>
          );

          return (
            <ListItem
              key={`${id}-${user.customer_id}`}
              className={listItemClass}
            >
              <ListItemAvatar>
                <EisbukAvatar {...user} />
              </ListItemAvatar>
              <ListItemText primary={user.name} />
              <ListItemSecondaryAction>
                {absenteeButtons}
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
};

// ***** Region Styles ***** //
const useStyles = makeStyles((theme: ETheme) => ({
  root: {},
  listHeader: {
    backgroundColor: theme.palette.primary.light,
  },
  slotWrapper: {
    marginBottom: theme.spacing(1.5),
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.primary.main,
  },
  absent: {
    backgroundColor: theme.palette.absent || grey[500],
  },
}));
// ***** End Region Styles ***** //
export default AttendanceCard;
