import { ICalendar } from "datebook";
import { DateTime } from "luxon";

import i18n, { NotificationMessage } from "@eisbuk/translations";
import {
  BookingSubCollection,
  CalendarEvents,
  ClientMessageMethod,
  ClientMessagePayload,
  ClientMessageType,
  Customer,
} from "@eisbuk/shared";
import { CloudFunction } from "@eisbuk/shared/ui";

import { NotifVariant } from "@/enums/store";

import { FirestoreThunk } from "@/types/store";

import { __organization__ } from "@/lib/constants";
import { getOrganization } from "@/lib/getters";

import { getAboutOrganization, getCalendarDay } from "../selectors/app";
import {
  getBookingsCustomer,
  getBookingsForCalendar,
} from "../selectors/bookings";
import { getCalendarEventsByMonth } from "../selectors/calendar";
import { enqueueNotification } from "@/features/notifications/actions";

import { createFunctionCaller } from "@/utils/firebase";
import { getBookingsPath, doc, setDoc } from "@/utils/firestore";

/**
 * A thunk in charge of comparing the last calendar sent to the customer
 * with the current one and sending a new one with added/cancelled events.
 * @param secretKey
 * @param email
 * @returns
 */
export const sendBookingsCalendar =
  (secretKey: string, email: string): FirestoreThunk =>
  async (dispatch, getState) => {
    const bookedSlots = getBookingsForCalendar(getState()) || {};

    const monthStr = getCalendarDay(getState()).toISO().substring(0, 7);

    const previousCalendar = getCalendarEventsByMonth(monthStr)(getState());

    const { name, surname } = getBookingsCustomer(secretKey)(getState());

    const { displayName = __organization__, location = "" } =
      getAboutOrganization(getState())[__organization__] || {};
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
        name,
        surname,
        email,
        secretKey,
        icsFile: icsFile,
      })
    );
  };

/**
 * Keeps track of calendar events created by customer
 */
const createCalendarEvents =
  ({
    monthStr,
    secretKey,
    eventUids,
  }: {
    monthStr: string;
    secretKey: Customer["secretKey"];
    eventUids: string[];
  }): FirestoreThunk =>
  async (dispatch, _, { getFirestore }) => {
    try {
      const db = getFirestore();
      const docRef = doc(
        db,
        getBookingsPath(getOrganization()),
        secretKey,
        BookingSubCollection.Calendar,
        monthStr
      );
      await setDoc(docRef, { uids: eventUids });
      // show success message
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SlotsAddedToCalendar),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
  };

/**
 * Send email of ics file
 */
interface SendICSFilePayload {
  name: Customer["name"];
  surname: Customer["surname"];
  email: string;
  icsFile: string;
  secretKey: Customer["secretKey"];
}

/**
 * A thunk in charge of sending an email with the ics file and
 * showing a success/error notification to the user.
 * @param param0
 * @returns
 */
const sendICSFile =
  ({
    icsFile,
    email,
    secretKey,
    name,
    surname,
  }: SendICSFilePayload): FirestoreThunk =>
  async (dispatch, _, { getFunctions }) => {
    try {
      const handler = CloudFunction.SendEmail;
      const payload = {
        type: ClientMessageType.SendCalendarFile,
        name,
        surname,
        secretKey,
        email,
        attachments: {
          filename: "bookedSlots.ics",
          content: icsFile,
        },
      } as Omit<
        ClientMessagePayload<
          ClientMessageMethod.Email,
          ClientMessageType.SendCalendarFile
        >,
        "organization"
      >;

      await createFunctionCaller(getFunctions(), handler, payload)();

      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.EmailSent),
          variant: NotifVariant.Success,
        })
      );
    } catch (err) {
      dispatch(
        enqueueNotification({
          message: i18n.t(NotificationMessage.Error),
          variant: NotifVariant.Error,
          error: err as Error,
        })
      );
    }
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

/**
 * Creates and adds cancelled events to icalendar instance
 * @param {{ [uid: string]: string }} previousCalendar
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
