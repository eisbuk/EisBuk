import React from "react";
import { useSelector, useStore } from "react-redux";
import { getFirestore } from "@firebase/firestore";

import i18n, { Alerts } from "@eisbuk/translations";
import { BookedHoursCalendar, CalendarSession, EmptySpace } from "@eisbuk/ui";

import { functions } from "@/setup";

import { getIsBookingAllowed } from "@/store/selectors/bookings";
import {
  CalendarSlotSession,
  getMonthBookingsSummary,
} from "@/store/selectors/bookings/calendarTotals";
import { getCalendarDay, getSecretKey } from "@/store/selectors/app";
import { updateBookingNotes } from "@/store/actions/bookingOperations";

import { createModal } from "@/features/modal/useModal";
import { FirestoreVariant } from "@/utils/firestore";

const CalendarView: React.FC = () => {
  const { dispatch, getState } = useStore();
  const currentDate = useSelector(getCalendarDay);
  const secretKey = useSelector(getSecretKey)!;

  const disabled = !useSelector(getIsBookingAllowed(secretKey, currentDate));

  const summary = useSelector(getMonthBookingsSummary);

  const { openWithProps: openCancelBookingDialog } = useCancelBookingModal();

  // Sessions passed back by the calendar are the ones from the summary (full slot included)
  const handleCancellation = (session: CalendarSession) =>
    openCancelBookingDialog({
      ...(session as CalendarSlotSession),
      secretKey,
    });

  const handleNotesUpdate = (session: CalendarSession, bookingNotes: string) =>
    // In order to be able to await this update, we're
    // using a bit of a different approach to firing a thunk
    // by runing a thunk explicitly and passing redux' dispatch and get state
    updateBookingNotes({
      slotId: session.id,
      secretKey,
      bookingNotes,
      date: session.date,
      interval: `${session.interval.startTime} - ${session.interval.endTime}`,
    })(dispatch, getState, {
      getFirestore: () => FirestoreVariant.client({ instance: getFirestore() }),
      getFunctions: () => functions,
    });

  const hasContent =
    summary.excluded.length > 0 ||
    summary.weeks.some((week) => week.days.some((day) => day.sessions.length));

  return hasContent ? (
    <BookedHoursCalendar
      summary={summary}
      disabled={disabled}
      onCancel={handleCancellation}
      onNotesEditSave={handleNotesUpdate}
    />
  ) : (
    <EmptySpace>{i18n.t(Alerts.NoBookings, { currentDate })}</EmptySpace>
  );
};

const useCancelBookingModal = createModal("CancelBookingDialog");

export default CalendarView;
