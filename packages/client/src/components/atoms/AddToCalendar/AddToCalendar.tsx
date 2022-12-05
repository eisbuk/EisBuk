import React, { useState } from "react";
import { useTranslation, ActionButton, Prompt } from "@eisbuk/translations";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { DateTime } from "luxon";
import { ICalendar } from "datebook";

import { CalendarEvents, Customer } from "@eisbuk/shared";

import InputDialog from "@/components/atoms/InputDialog";
import {
  Button,
  IconButton,
  IconButtonContentSize,
  IconButtonShape,
  IconButtonSize,
} from "@eisbuk/ui";
import { Calendar } from "@eisbuk/svg";

import { getAboutOrganization, getCalendarDay } from "@/store/selectors/app";
import { getCalendarEventsByMonth } from "@/store/selectors/calendar";
import { getBookingsForCalendar } from "@/store/selectors/bookings";

import {
  createCalendarEvents,
  sendICSFile,
} from "@/store/actions/bookingOperations";

import { __organization__ } from "@/lib/constants";
import { getCustomer } from "@/store/selectors/customers";

const AddToCalendar: React.FC = () => {
  const dispatch = useDispatch();

  const { secretKey } = useParams<{ secretKey: string }>();

  const { t } = useTranslation();

  const [emailDialog, setEmailDialog] = useState(false);

  const bookedSlots = useSelector(getBookingsForCalendar) || {};

  const monthStr = useSelector(getCalendarDay).toISO().substring(0, 7);

  const previousCalendar = useSelector(getCalendarEventsByMonth(monthStr));

  const { name } = useSelector(getCustomer(secretKey)) as Customer;

  const { displayName = "displayName", location = "" } =
    useSelector(getAboutOrganization)[__organization__] || {};

  const handleClick = (email: string) => {
    let icalendar = {} as ICalendar;

    const previousCalendarUids = Object.keys(previousCalendar).length
      ? getPreviousCalendarUids(previousCalendar)
      : {};

    const eventUids: string[] = [];

    Object.values(bookedSlots).forEach((bookedSlot, i) => {
      const slotDate = bookedSlot.date;

      const startDate = getDate(slotDate, bookedSlot.interval.startTime);
      const endDate = getDate(slotDate, bookedSlot.interval.endTime);

      const bookedSlotEvent = {
        title: `Booked ${bookedSlot.type} Slot at ${displayName}`,
        location: location,
        start: startDate,
        end: endDate,
      };

      const uid =
        `${bookedSlot.interval.startTime}${bookedSlot.interval.endTime}${slotDate}`.replace(
          /[-:]/g,
          ""
        );
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
    dispatch(
      sendICSFile({
        icsFile: icsFile,
        email,
        secretKey,
        name: name,
        displayName: displayName,
      })
    );
  };

  // Don't render the component if there are no booked slots to save to calendar
  if (!bookedSlots.length) return null;

  return (
    <>
      <Button
        className="hidden bg-cyan-700 text-white md:block active:bg-cyan-800"
        onClick={() => setEmailDialog(true)}
      >
        {t(ActionButton.AddToCalendar)}
      </Button>

      <IconButton
        aria-label={t(ActionButton.AddToCalendar)}
        className="fixed right-6 bottom-8 z-40 bg-cyan-700 text-white shadow-xl md:hidden"
        size={IconButtonSize.XL}
        contentSize={IconButtonContentSize.Loose}
        shape={IconButtonShape.Round}
        onClick={() => setEmailDialog(true)}
      >
        <Calendar />
      </IconButton>

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

const getDate = (date: string, interval: string) =>
  DateTime.fromISO(date)
    .set({
      hour: Number(interval.substring(0, 2)),
      minute: Number(interval.substring(3, 5)),
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
    const start = DateTime.local()
      .set({
        year: Number(uid.substring(8, 12)),
        month: Number(uid.substring(12, 14)),
        day: Number(uid.substring(14)),
        hour: Number(uid.substring(0, 2)),
        minute: Number(uid.substring(2, 4)),
      })
      .setZone("utc")
      .toJSDate();

    const end = DateTime.local()
      .set({
        year: Number(uid.substring(8, 12)),
        month: Number(uid.substring(12, 14)),
        day: Number(uid.substring(14)),
        hour: Number(uid.substring(4, 6)),
        minute: Number(uid.substring(6, 8)),
      })
      .setZone("utc")
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

export default AddToCalendar;
