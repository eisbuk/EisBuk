import React from "react";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import { CustomerWithAttendance, SlotInterface } from "@/types/temp";
import AttendanceSheetSlot from "./AttendanceSheetSlot";

interface SlotWithCustomers extends SlotInterface {
  /**
   * Record of customers who have booked (or are manually as attended),
   * keyed by `customerId` and having all of the data for the customer plus
   * values for `bookedInterval` and `attendedInterval`.
   */
  customers: CustomerWithAttendance[];
}
export interface Props {
  date: SlotInterface["date"];
  slots: SlotWithCustomers[];
}

const AttendanceSheet: React.FC<Props> = ({ slots, date }) => {
  /** @TODO find suitable tag for the title*/
  return (
    <TableContainer component={Paper}>
      <div>Attendance for {date}</div>
      {slots.map((slot) => (
        <AttendanceSheetSlot {...slot} />
      ))}
    </TableContainer>
  );
};
export default AttendanceSheet;
