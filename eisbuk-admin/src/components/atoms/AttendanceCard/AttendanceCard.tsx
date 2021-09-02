import React from "react";
import { fb2Luxon } from "@/utils/date";
import i18n from "i18next";
// import { useTranslation } from "react-i18next";
import _ from "lodash";

import Container from "@material-ui/core/Container";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import makeStyles from "@material-ui/core/styles/makeStyles";
import UserAttendance from "@/components/atoms/UserAttendance/UserAttendance";
import {
  Slot,
  Customer,
  BookingsMeta,
  Category,
  SlotType,
} from "eisbuk-shared";

import { ETheme } from "@/themes";

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
  const classes = useStyles();
  // const { t } = useTranslation();
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
        <div key={id + "-" + timeString} className={classes.slotWrapper}>
          <ListItem className={classes.listHeader}>
            <ListItemText
              primary={
                <span>
                  {timeString} <b>({userBookings.length})</b>
                </span>
              }
              secondary={translateAndJoinTags(categories, type)}
            />
          </ListItem>
          {userBookings.map((user) => {
            const isAbsent = absentees?.includes(user.customer_id) || false;

            return (
              <UserAttendance
                key={`${id}-${user.customer_id}`}
                isAbsent={isAbsent}
                userBooking={user}
              ></UserAttendance>
            );
          })}
        </div>
      </List>
    </Container>
  );
};

// ***** Start Region Local Utils ***** //

const translateAndJoinTags = (categories: Category[], type: SlotType) => {
  const translatedCategories = categories.map((category) =>
    i18n.t(`Categories.${category}`)
  );
  const translatedType = i18n.t(`SlotTypes.${type}`);

  return `${[...translatedCategories, translatedType].join(" ")}`;
};
// ***** End Region Local Utils ***** //
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
    backgroundColor: theme.palette.absent || theme.palette.grey[500],
  },
}));
// ***** End Region Styles ***** //
export default AttendanceCard;
