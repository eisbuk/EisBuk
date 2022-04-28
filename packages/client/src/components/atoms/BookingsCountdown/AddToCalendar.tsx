import React from "react";
import { useTranslation, ActionButton } from "@eisbuk/translations";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { DateTime } from "luxon";
import { ICalendar } from "datebook";

import makeStyles from "@mui/styles/makeStyles";

import Button from "@mui/material/Button";

import { CalendarEvents } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { getAboutOrganization } from "@/store/selectors/app";
import { getCalendarEventsByMonth } from "@/store/selectors/calendar";

import {
  createCalendarEvents,
  sendICSFile,
} from "@/store/actions/bookingOperations";

import { __addToCalendarButtonId__ } from "@/__testData__/testIds";

interface Props {
  /**
   * Record of subscribed slots with subscribed slotIds as keys and subscribed duration as value.
   * Doesn't need to be organized as we're checking for each value by key (no need for ordering and grouping).
   */
  bookedSlots: LocalStore["firestore"]["data"]["bookedSlots"];
}

const AddToCalendar: React.FC<Props> = ({ bookedSlots = {} }) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const { secretKey } = useParams<{ secretKey: string }>();

  const { t } = useTranslation();

  const monthStr = (Object.values(bookedSlots!)[0].date || "").substring(0, 7);

  const previousCalendar = useSelector(getCalendarEventsByMonth(monthStr));

  const { displayName = "", location = "" } =
    useSelector(getAboutOrganization) || {};

  // is displayed when bookings are finalized aka deadline is null
  const handleClick = () => {
    let icalendar: ICalendar;

    const previousCalendarUids = Object.keys(previousCalendar).length
      ? getPreviousCalendarUids(previousCalendar)
      : {};

    const eventUids: string[] = [];

    Object.values(bookedSlots).forEach((bookedSlot, i) => {
      const startDate = getStartDate(bookedSlot.date, bookedSlot.interval);
      const endDate = getEndDate(bookedSlot.date, bookedSlot.interval);

      // console.log(`${bookedSlot.date}${bookedSlot.interval}`);
      const bookedSlotEvent = {
        title: `Booked Slot at ${displayName}`,
        location: location,
        start: startDate,
        end: endDate,
      };
      const uid = `${bookedSlot.date}${bookedSlot.interval}`;
      eventUids.push(uid);
      delete previousCalendarUids[uid];

      /**
       * ICalendar needs to be instantiated with an event
       * which can't be an empty object so on the first iteration
       * it's instantiated with the first bookedSlotEvent
       */
      if (i === 0) {
        icalendar = new ICalendar(bookedSlotEvent).addProperty("UID", uid);
      } else {
        /**
         * To add another event to the calendar it must be of type ICalendar
         */
        icalendar.addEvent(
          new ICalendar(bookedSlotEvent).addProperty("UID", uid)
        );
      }
      /**
       * Download calendar on last iteration
       */
      if (i === Object.keys(bookedSlots).length - 1) {
        createCancelledEvents(previousCalendarUids, icalendar, displayName);
        icalendar.download("Booked_Slots.ics");
        dispatch(createCalendarEvents({ monthStr, secretKey, eventUids }));
        dispatch(sendICSFile({ secretKey: secretKey, icsFile: "icsFileHere" }));
      }
    });
  };
  return (
    <div className={classes.container}>
      <Button
        data-testid={__addToCalendarButtonId__}
        onClick={handleClick}
        variant="contained"
      >
        {t(ActionButton.AddToCalendar)}
      </Button>
    </div>
  );
};

// #region helpers

const getStartDate = (date: string, interval: string) =>
  DateTime.fromISO(date)
    .set({
      hour: Number(interval.substring(0, 2)),
      minute: Number(interval.substring(3, 5)),
    })
    .toJSDate();
const getEndDate = (date: string, interval: string) =>
  DateTime.fromISO(date)
    .set({
      hour: Number(interval.substring(6, 8)),
      minute: Number(interval.substring(9, 11)),
    })
    .toJSDate();

const createCancelledEvents = (
  previousCalendar: { [uid: string]: string },
  icalendar: ICalendar,
  displayName: string
) => {
  Object.values(previousCalendar).forEach((uid) => {
    console.log("cancelled uid", { uid });
    const start = getStartDate(uid.substring(0, 10), uid.substring(10));
    const end = getEndDate(uid.substring(0, 10), uid.substring(10));
    icalendar.addEvent(
      new ICalendar({ title: `Booked Slot at ${displayName}`, start, end })
        .addProperty("UID", uid)
        .addProperty("STATUS", "CANCELLED")
    );
  });
};
const getPreviousCalendarUids = (
  previousCalendar: CalendarEvents["monthStr"]
) =>
  previousCalendar.uids.reduce((acc, curr) => {
    return { ...acc, [curr]: curr };
  }, {});
// #endregion helpers

// #region styles
const useStyles = makeStyles(() => ({
  container: {
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
}));
// #endregion styles

export default AddToCalendar;
