import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { Button } from "@eisbuk/ui";
import { Printer } from "@eisbuk/svg";

import AttendanceCard from "@/controllers/AttendanceCard";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { getCustomersList } from "@/store/selectors/customers";

const AttendanceByDayView: React.FC = () => {
  const attendanceCards = useSelector(getSlotsWithAttendance);
  const allCustomers = useSelector(getCustomersList(true));

  return (
    <>
      <div className="max-w-[1024px] py-12 mx-auto">
        {attendanceCards.map((attendanceCard) => (
          <AttendanceCard
            key={attendanceCard.id}
            {...{ ...attendanceCard, allCustomers }}
          />
        ))}
      </div>
      <div className="fixed bottom-0 w-full flex justify-end -mx-4 px-2 py-1.5 bg-ice-300 z-40 border-t border-gray-300 md:hidden">
        <Link to="/attendance_printable">
          <Button className="h-11 text-gray-600">
            <span className="text-md">Print</span>{" "}
            <span className="w-8 h-8">
              <Printer />
            </span>
          </Button>
        </Link>
      </div>
    </>
  );
};

export default AttendanceByDayView;
