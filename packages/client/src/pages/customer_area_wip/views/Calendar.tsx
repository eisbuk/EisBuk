import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { getBookingsForCalendar } from "@/store/selectors/bookings";
import { IntervalCard, IntervalCardVariant } from "@eisbuk/ui";
import { openModal } from "@/features/modal/actions";

const CalendarView: React.FC = () => {
  const dispatch = useDispatch();

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

  return (
    <div className="w-full flex flex-wrap gap-[30px] py-12">
      {bookedSlots.map((props) => (
        <IntervalCard
          onCancel={() => handleCancellation(props)}
          variant={IntervalCardVariant.Calendar}
          {...props}
        />
      ))}
    </div>
  );
};

export default CalendarView;
