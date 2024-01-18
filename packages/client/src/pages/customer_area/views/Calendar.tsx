import React from "react";
import { useSelector, useStore } from "react-redux";
import { getFirestore } from "@firebase/firestore";

import i18n, { Alerts } from "@eisbuk/translations";
import {
  EmptySpace,
  IntervalCard,
  IntervalCardState,
  IntervalCardVariant,
} from "@eisbuk/ui";

import { functions } from "@/setup";

import {
  getIsBookingAllowed,
  getBookedAndAttendedSlotsForCalendar,
} from "@/store/selectors/bookings";
import { getCalendarDay, getSecretKey } from "@/store/selectors/app";
import { updateBookingNotes } from "@/store/actions/bookingOperations";

import { createModal } from "@/features/modal/useModal";
import { ModalPayload } from "@/features/modal/types";
import { FirestoreVariant } from "@/utils/firestore";

const CalendarView: React.FC = () => {
  const { dispatch, getState } = useStore();
  const currentDate = useSelector(getCalendarDay);
  const secretKey = useSelector(getSecretKey)!;

  const disabled = !useSelector(getIsBookingAllowed(secretKey, currentDate));

  const bookedAndAttendedSlots = useSelector(
    getBookedAndAttendedSlotsForCalendar
  );

  const state = disabled
    ? IntervalCardState.Disabled
    : IntervalCardState.Default;

  const { openWithProps: openCancelBookingDialog } = useCancelBookingModal();

  const handleCancellation = (
    props: ModalPayload<"CancelBookingDialog">["props"]
  ) => openCancelBookingDialog(props);

  const handleNotesUpdate = (
    bookingNotes: string,
    slotId: string,
    date: string,
    interval: string
  ) =>
    // In order to be able to await this update, we're
    // using a bit of a different approach to firing a thunk
    // by runing a thunk explicitly and passing redux' dispatch and get state
    updateBookingNotes({
      slotId,
      secretKey,
      bookingNotes,
      date,
      interval,
    })(dispatch, getState, {
      getFirestore: () => FirestoreVariant.client({ instance: getFirestore() }),
      getFunctions: () => functions,
    });

  const slotsToRender = bookedAndAttendedSlots.map((props) => (
    <IntervalCard
      key={props.id}
      onCancel={() => handleCancellation({ ...props, secretKey })}
      onNotesEditSave={(bookingNotes) =>
        handleNotesUpdate(
          bookingNotes,
          props.id,
          props.date,
          `${props.interval.startTime} - ${props.interval.endTime}`
        )
      }
      state={state}
      variant={
        props.booked ? IntervalCardVariant.Calendar : IntervalCardVariant.Simple
      }
      {...props}
    />
  ));

  return slotsToRender.length ? (
    <div className="w-full flex flex-wrap gap-[30px] py-12">
      {slotsToRender}
    </div>
  ) : (
    <EmptySpace>{i18n.t(Alerts.NoBookings, { currentDate })}</EmptySpace>
  );
};

const useCancelBookingModal = createModal("CancelBookingDialog");

export default CalendarView;
