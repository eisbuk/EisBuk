import React, { useState } from "react";
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
  Duration,
  Category,
  SlotType,
} from "eisbuk-shared";

import { ETheme } from "@/themes";

import EisbukAvatar from "@/components/users/EisbukAvatar";

import { slotsLabels } from "@/config/appConfig";

// ***** Region Main Component ***** //
type UserBooking = Pick<Customer, "id"> &
  Pick<Customer, "name"> &
  Pick<Customer, "surname"> &
  Pick<Customer, "certificateExpiration"> &
  Pick<BookingInfo, "duration"> &
  Pick<Customer, "covidCertificateReleaseDate"> &
  Pick<Customer, "covidCertificateSuspended">;

type BookingEntry = Pick<BookingInfo, "categories"> &
  Pick<Slot, "type"> &
  Pick<Slot<"id">, "id"> &
  Pick<Slot, "durations"> & {
    time: string;
    users: UserBooking[];
    absentees?: Record<string, boolean>;
  };

type BookingDayInfo = BookingEntry[];

type ProcessedSlot = BookingEntry & {
  duration: Duration;
  endTime: string;
};

interface Props {
  bookingDayInfo: BookingDayInfo;
  markAbsentee?: (payload: {
    slotId: Slot<"id">["id"];
    userId: UserBooking["id"];
    isAbsent: boolean;
  }) => void;
}

const BookingsByDay: React.FC<Props> = ({ bookingDayInfo, markAbsentee }) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const [localAbsentees, setLocalAbsentees] = useState({});

  const periods = getPeriods(bookingDayInfo);

  /**
   * Handler used to toggle athlete being absent,
   * both locally and dispatch update to firestore
   * @param slot slot for which we're marking attendance
   * @param userBooking info of booking for which we're toggling attendance (user info, duration)
   * @param isAbsent boolean, previous state of attendance
   */
  const toggleAbsent = (
    slot: ProcessedSlot,
    userBooking: UserBooking,
    isAbsent: boolean
  ) => {
    // update local state with absentees
    setLocalAbsentees((state) => ({
      ...state,
      [slot.id]: {
        ...state[slot.id],
        [userBooking.id]: !isAbsent,
      },
    }));
    // presist attendance data to firestore
    markAbsentee &&
      markAbsentee({
        slotId: slot.id,
        userId: userBooking.id,
        isAbsent: !isAbsent,
      });
  };

  /**
   * Checks difference between firestore state and local state for given user,
   * used to disable the toggle button until the attendance statuses are in sync
   * @param slot for which we're checking attendance
   * @param userBooking id of booking for which we're checking for difference
   * @param isAbsentInFirestore boolean, attendance status in firestore
   * @returns true if states (locally and in firestore) don't match
   */
  const checkLocalChange = (
    slot: ProcessedSlot,
    bookingId: UserBooking["id"],
    isAbsentInFirestore: boolean
  ): boolean =>
    localAbsentees[slot.id] &&
    localAbsentees[slot.id][bookingId] &&
    localAbsentees[slot.id][bookingId] !== isAbsentInFirestore;

  return (
    <Container maxWidth="sm">
      <List className={classes.root}>
        {periods.map((slot) => {
          return (
            <div
              key={slot.id + "-" + slot.duration}
              className={classes.slotWrapper}
            >
              <ListItem className={classes.listHeader}>
                <ListItemText
                  primary={
                    <span>
                      {slot.time} - {slot.endTime} <b>({slot.users.length})</b>
                    </span>
                  }
                  secondary={translateAndJoinTags(slot.categories, slot.type)}
                />
              </ListItem>
              {slot.users.map((userBooking) => {
                // set absence status with respect to firestore state
                let isAbsent = Boolean((slot.absentees || {})[userBooking.id]);

                // check for discrepancy between local attendance (absence) status and the one in firestore
                const hasLocalChange = checkLocalChange(
                  slot,
                  userBooking.id,
                  isAbsent
                );

                // update absence status (for UI display) with respect to local state
                isAbsent = hasLocalChange ? !isAbsent : isAbsent;

                const absenteeButtons = markAbsentee ? (
                  <Button
                    variant="contained"
                    size="small"
                    color={isAbsent ? "primary" : "secondary"}
                    onClick={() => toggleAbsent(slot, userBooking, isAbsent)}
                    disabled={hasLocalChange}
                  >
                    {isAbsent ? "👎" : "👍"}
                  </Button>
                ) : null;
                const listItemClass = isAbsent ? classes.absent : "";

                const absentTag = isAbsent
                  ? ` (${t("BookingsByDay.Absent")})`
                  : "";
                const userName = `${userBooking.name} ${userBooking.surname} ${absentTag}`;

                return (
                  <ListItem
                    key={`${slot.id}-${userBooking.id}`}
                    className={listItemClass}
                  >
                    <ListItemAvatar>
                      <EisbukAvatar {...userBooking} />
                    </ListItemAvatar>
                    <ListItemText primary={userName} />
                    <ListItemSecondaryAction>
                      {absenteeButtons}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </div>
          );
        })}
      </List>
    </Container>
  );
};
// ***** End Region Main Component ***** //

// ***** Region Local Utils ***** //
const getPeriods = (bookingDayInfo: BookingDayInfo) =>
  bookingDayInfo.reduce((acc, currEntry) => {
    return [...acc, ...splitPeriod(currEntry)];
  }, [] as ReturnType<typeof splitPeriod>);

const splitPeriod = (bookingEntry: BookingEntry): ProcessedSlot[] => {
  const userBookingsByDuration = _.groupBy(
    bookingEntry.users,
    (userBooking) => userBooking.duration
  );
  return bookingEntry.durations.map((duration) => ({
    ...bookingEntry,
    duration,
    users: userBookingsByDuration[duration] || [],
    endTime: DateTime.fromISO(bookingEntry.time)
      .plus({ minutes: slotsLabels.durations[duration].minutes })
      .toFormat("HH:mm"),
  }));
};

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
    backgroundColor: theme.palette.absent || grey[500],
  },
}));
// ***** End Region Styles ***** //

export default BookingsByDay;
