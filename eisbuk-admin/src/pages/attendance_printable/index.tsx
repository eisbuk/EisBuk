import React from "react";
import { useSelector } from "react-redux";

import Container from "@material-ui/core/Container";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import DateNavigation from "@/components/atoms/DateNavigation";
import AttendanceSheet, {
  AttendanceSheetSlot,
} from "@/components/atoms/AttendanceSheet";

import { getCalendarDay } from "@/store/selectors/app";
import { getSlotsWithAttendance } from "@/store/selectors/attendance";

const DashboardPage: React.FC = () => {
  const attendanceSlots = useSelector(getSlotsWithAttendance);

  const date = useSelector(getCalendarDay);

  return (
    <>
      <AppbarAdmin />
      <DateNavigation jump="day">
        {() => (
          <Container maxWidth="sm">
            <AttendanceSheet date={date}>
              {attendanceSlots.map((slot) => (
                <AttendanceSheetSlot {...slot} />
              ))}
            </AttendanceSheet>
          </Container>
        )}
      </DateNavigation>
    </>
  );
};

export default DashboardPage;
