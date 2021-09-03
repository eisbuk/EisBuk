import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { fb2Luxon } from "@/utils/date";
import i18n from "i18next";

// import { useTranslation } from "react-i18next";
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
import { markAttendance } from "@/store/actions/attendanceOperations";

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
  type,
  id,
}) => {
  const classes = useStyles();
  const dispatch = useDispatch();

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

  // #region absentees

  // type MarkAbsentee = (payload: {
  //   slotId: Slot<"id">["id"];
  //   userId: UserBooking["customer_id"];
  //   isAbsent: boolean;
  // }) => void;

  const [localAbsentees, setLocalAbsentees] = useState({});
  // const markAbsentee: MarkAbsentee = (
  //   args: Parameters<typeof markAbsentee>[0]
  // ) => dispatch(markAbsentee(args));

  /**
   * Handler used to toggle athlete being absent,
   * both locally and dispatch update to firestore
   * @param userBooking info of booking for which we're toggling attendance (user info, duration)
   * @param isAbsent boolean, previous state of attendance
   */
  const toggleAbsent = (userBooking: UserBooking, isAbsent: boolean) => {
    // update local state with absentees
    setLocalAbsentees((state) => ({
      ...state,
      [userBooking.customer_id]: !isAbsent,
    }));
    // presist attendance data to firestore
    markAttendance && markAttendance(userBooking.customer_id, !isAbsent);
  };

  const checkLocalChange = (
    bookingId: UserBooking["customer_id"],
    isAbsentInFirestore: boolean
  ): boolean =>
    localAbsentees[bookingId] &&
    localAbsentees[bookingId] !== isAbsentInFirestore;

  // #endregion absentees
  return (
    <div className={classes.wrapper}>
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
        // set absence status with respect to firestore state
        const isAbsent = Boolean(absentees?.includes(user.customer_id));

        // check for discrepancy between local attendance (absence) status and the one in firestore
        const hasLocalChange = checkLocalChange(user.customer_id, isAbsent);

        return (
          <UserAttendance
            key={user.customer_id}
            isAbsent={absentees?.includes(user.customer_id)}
            userBooking={user}
            toggleAbsent={toggleAbsent}
            hasLocalChange={hasLocalChange}
          />
        );
      })}
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
