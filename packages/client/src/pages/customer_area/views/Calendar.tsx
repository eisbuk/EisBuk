import React from "react";
import { useSelector, useStore } from "react-redux";

import i18n, { Alerts } from "@eisbuk/translations";
import {
  EmptySpace,
  IntervalCard,
  IntervalCardState,
  IntervalCardVariant,
} from "@eisbuk/ui";

import {
  getBookingsForCalendar,
  getIsBookingAllowed,
} from "@/store/selectors/bookings";
import { openModal } from "@/features/modal/actions";
import { getCalendarDay } from "@/store/selectors/app";
import { updateBookingNotes } from "@/store/actions/bookingOperations";

import { getSecretKey } from "@/utils/localStorage";

const CalendarView: React.FC = () => {
  const { dispatch, getState } = useStore();
  const currentDate = useSelector(getCalendarDay);

  const disabled = !useSelector(getIsBookingAllowed(currentDate));

  const bookedSlots = useSelector(getBookingsForCalendar);

  const state = disabled
    ? IntervalCardState.Disabled
    : IntervalCardState.Default;

  const handleCancellation = (
    props: Parameters<typeof openModal>[0]["props"]
  ) => {
    dispatch(
      openModal({
        component: "CancelBookingDialog",
        props,
      })
    );
  };
  const handleNotesUpdate = (bookingNotes: string, slotId: string) =>
    // In order to be able to await this update, we're
    // using a bit of a different approach to firing a thunk
    // by runing a thunk explicitly and passing redux' dispatch and get state
    updateBookingNotes({
      slotId,
      secretKey: getSecretKey(),
      bookingNotes,
    })(dispatch, getState);

  const slotsToRender = bookedSlots.map((props) => (
    <IntervalCard
      key={props.id}
      onCancel={() => handleCancellation(props)}
      onNotesEditSave={(bookingNotes) =>
        handleNotesUpdate(bookingNotes, props.id)
      }
      variant={IntervalCardVariant.Calendar}
      state={state}
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

export default CalendarView;
