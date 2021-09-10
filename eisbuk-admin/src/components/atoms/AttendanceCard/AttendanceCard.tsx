import React from "react";
import { fb2Luxon } from "@/utils/date";
import i18n from "i18next";

// import { useTranslation } from "react-i18next";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import makeStyles from "@material-ui/core/styles/makeStyles";
import UserAttendance from "@/components/atoms/UserAttendance/UserAttendance";
import { SlotInterface } from "@/types/temp";
import {
  Customer,
  BookingsMeta,
  Category,
  SlotType,
} from "eisbuk-shared";

import { ETheme } from "@/themes";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
type UserBooking = BookingsMeta & Pick<Customer, "certificateExpiration">;

interface Props extends SlotInterface {
  userBookings: UserBooking[];
}

// mark attendees
const AttendanceCard: React.FC<Props> = ({
  date,
  categories,
  userBookings,
  attendance,
  intervals,
  type,
  id,
}) => {
  const classes = useStyles();

  // const { t } = useTranslation();
  // convert timestamp to luxon for easier processing
  // const luxonStart = fb2Luxon(date);

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
    <div className={classes.wrapper}>
      <ListItem className={classes.listHeader}>
        <ListItemText
          primary={
            <span>
              {"13:00 - 14:00"} <b>({userBookings.length})</b>
            </span>
          }
          secondary={translateAndJoinTags(categories, type)}
        />
      </ListItem>
      {userBookings.map((user) => (
        <UserAttendance
          key={user.customer_id}
          slotId={id}
          attended={attendance?[user.customer_id].attended}
          userBooking={user}
          intervals={intervals}
        />
      ))}
    </div>
  );
};

// #region Start Region Local Utils

const translateAndJoinTags = (categories: Category[], type: SlotType) => {
  const translatedCategories = categories.map((category) =>
    i18n.t(`Categories.${category}`)
  );
  const translatedType = i18n.t(`SlotTypes.${type}`);

  return `${[...translatedCategories, translatedType].join(" ")}`;
};
// #endregion Local Utils

// #region Styles
const useStyles = makeStyles((theme: ETheme) => ({
  listHeader: {
    backgroundColor: theme.palette.primary.light,
  },
  wrapper: {
    marginBottom: theme.spacing(1.5),
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.primary.main,
  },
}));
// #endregion Styles
export default AttendanceCard;
