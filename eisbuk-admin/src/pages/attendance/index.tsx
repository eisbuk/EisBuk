import React from "react";
import { useSelector } from "react-redux";

import Container from "@material-ui/core/Container";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import DateNavigation from "@/components/atoms/DateNavigation";

import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import AttendanceSheet from "@/components/atoms/AttendanceSheet/AttendanceSheet";
import AttendanceSheetSlot from "@/components/atoms/AttendanceSheet/AttendanceSheetSlot";
import { getCalendarDay } from "@/store/selectors/app";

const DashboardPage: React.FC = () => {

    const attendanceSlots = useSelector(getSlotsWithAttendance);

    const date = useSelector(getCalendarDay)
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
