import React from "react";
import { useDispatch, useSelector } from "react-redux";

import i18n, { Alerts } from "@eisbuk/translations";
import { EmptySpace, IntervalCard, IntervalCardVariant } from "@eisbuk/ui";

import { getBookingsForCalendar } from "@/store/selectors/bookings";
import { openModal } from "@/features/modal/actions";
import { getCalendarDay } from "@/store/selectors/app";

const CalendarView: React.FC = () => {
  const dispatch = useDispatch();
  const currentDate = useSelector(getCalendarDay);

  const bookedSlots = useSelector(getBookingsForCalendar);

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

  const slotsToRender = bookedSlots.map((props) => (
    <IntervalCard
      key={props.id}
      onCancel={() => handleCancellation(props)}
      variant={IntervalCardVariant.Calendar}
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
