import React, { useState } from "react";
import { useTranslation, ActionButton, Prompt } from "@eisbuk/translations";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { DateTime } from "luxon";
import { ICalendar } from "datebook";

import makeStyles from "@mui/styles/makeStyles";

import Button from "@mui/material/Button";

import { CalendarEvents, SlotsByDay } from "@eisbuk/shared";

import { LocalStore } from "@/types/store";

import { getAboutOrganization } from "@/store/selectors/app";
import { getCalendarEventsByMonth } from "@/store/selectors/calendar";

import {
  createCalendarEvents,
  sendICSFile,
} from "@/store/actions/bookingOperations";

import { __addToCalendarButtonId__ } from "@/__testData__/testIds";

import { __organization__ } from "@/lib/constants";

import InputDialog from "@/components/atoms/InputDialog";

interface Props {
  /**
   * Record of subscribed slots with subscribed slotIds as keys and subscribed duration as value.
   * Doesn't need to be organized as we're checking for each value by key (no need for ordering and grouping).
   */
  bookedSlots: LocalStore["firestore"]["data"]["bookedSlots"];
  /**
   * Record of slots grouped by day's ISO date (day),
   * keyed by slotId within each day.
   */
  slots: SlotsByDay;
}

const AddToCalendar: React.FC<Props> = ({ bookedSlots = {}, slots = {} }) => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const { secretKey } = useParams<{ secretKey: string }>();

  const { t } = useTranslation();

  const [emailDialog, setEmailDialog] = useState(false);

  const monthStr = (Object.values(bookedSlots!)[0].date || "").substring(0, 7);

  const previousCalendar = useSelector(getCalendarEventsByMonth(monthStr));

  const { displayName = "", location = "" } =
    useSelector(getAboutOrganization)[__organization__] || {};

  const handleClick = (email: string) => {
    let icalendar = {} as ICalendar;

    const previousCalendarUids = Object.keys(previousCalendar).length
      ? getPreviousCalendarUids(previousCalendar)
      : {};

    const eventUids: string[] = [];

    Object.entries(bookedSlots).forEach((bookedSlot, i) => {
      const bookedSlotId = bookedSlot[0];
      const bookedSlotValue = bookedSlot[1];
      const slotDate = bookedSlot[1].date;

      const startDate = getStartDate(slotDate, bookedSlotValue.interval);
      const endDate = getEndDate(slotDate, bookedSlotValue.interval);

      const slotType = slots[slotDate][bookedSlotId].type;

      const bookedSlotEvent = {
        title: `Booked ${slotType} Slot at ${displayName}`,
        location: location,
        start: startDate,
        end: endDate,
      };
      const uid = `${bookedSlotValue.interval}${slotDate}`.replace(/[-:]/g, "");
      eventUids.push(uid);
      delete previousCalendarUids[uid];

      // ICalendar needs to be instantiated with an event
      // which can't be an empty object so on the first iteration
      // it's instantiated with the first bookedSlotEvent

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
    });
    createCancelledEvents(previousCalendarUids, icalendar, displayName);
    dispatch(createCalendarEvents({ monthStr, secretKey, eventUids }));
    const icsFile = icalendar.render();
    dispatch(sendICSFile({ icsFile: icsFile, email, secretKey }));
  };

  return (
    <>
      <div className={classes.container}>
        <Button
          data-testid={__addToCalendarButtonId__}
          onClick={() => setEmailDialog(true)}
          variant="contained"
        >
          {t(ActionButton.AddToCalendar)}
        </Button>
      </div>
      <InputDialog
        title={t(Prompt.EnterEmailTitle)}
        onSubmit={handleClick}
        open={emailDialog}
        setOpen={(open: boolean) => (open ? null : setEmailDialog(false))}
      >
        {t(Prompt.EnterEmailMessage)}
      </InputDialog>
    </>
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

/**
 * Creates and adds cancelled events to icalendar instance
 * @param { [uid: string]: string } previousCalendar
 * @param  {ICalendar} icalendar
 * @param {string} displayName
 */
const createCancelledEvents = (
  previousCalendar: { [uid: string]: string },
  icalendar: ICalendar,
  displayName: string
) => {
  Object.values(previousCalendar).forEach((uid) => {
    const start = DateTime.utc()
      .set({
        year: Number(uid.substring(8, 12)),
        month: Number(uid.substring(12, 14)),
        day: Number(uid.substring(14)),
        hour: Number(uid.substring(0, 2)),
        minute: Number(uid.substring(2, 4)),
      })
      .toJSDate();
    const end = DateTime.utc()
      .set({
        year: Number(uid.substring(8, 12)),
        month: Number(uid.substring(12, 14)),
        day: Number(uid.substring(14)),
        hour: Number(uid.substring(4, 6)),
        minute: Number(uid.substring(6, 8)),
      })
      .toJSDate();

    icalendar.addEvent(
      new ICalendar({
        title: `Cancelled Booking at ${displayName}`,
        start,
        end,
      })
        .addProperty("UID", uid)
        .addProperty("STATUS", "CANCELLED")
    );
  });
};
/**
 * Gets uids of events previously saved to calendar (from calendar subcollection of bookedSlots)
 * @param {CalendarEvents["monthStr"]} previousCalendar
 * @returns { [uid: string]: string } object of uids
 */
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
