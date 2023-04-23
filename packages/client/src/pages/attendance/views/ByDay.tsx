import React from "react";
import { useSelector } from "react-redux";

import AttendanceCard from "@/controllers/AttendanceCard";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { getCustomersList } from "@/store/selectors/customers";

const AttendanceByDayView: React.FC = () => {
  const attendanceCards = useSelector(getSlotsWithAttendance);
  const allCustomers = useSelector(getCustomersList(true));

  return (
    <div className="content-container">
      <div className="max-w-[1024px] py-12 mx-auto">
        {attendanceCards.map((attendanceCard) => (
          <AttendanceCard
            key={attendanceCard.id}
            {...{ ...attendanceCard, allCustomers }}
          />
        ))}
      </div>
    </div>
  );
};

export default AttendanceByDayView;
