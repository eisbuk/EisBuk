import * as React from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import { fb2Luxon } from "@/utils/date";
import { CustomerWithAttendance, SlotInterface } from "@/types/temp";

export interface Props extends SlotInterface {
  /**
   * Record of customers who have booked (or are manually as attended),
   * keyed by `customerId` and having all of the data for the customer plus
   * values for `bookedInterval` and `attendedInterval`.
   */
  customers: CustomerWithAttendance[];
}
// const groupCustomersByAttendedInterval = (
//   intervals: {
//     [key: string]: SlotInterval;
//   },
//   customers: CustomerWithAttendance[]
// ) => {
//   const intervalsEmpty = Object.keys(intervals).reduce((acc, curr) => {
//     acc[curr] = [];
//     return acc;
//   }, {});
//   customers.forEach((customer) => {
//     customer.bookedInterval &&
//       intervalsEmpty[customer.bookedInterval].push(customer.name);
//   });
//   return intervalsEmpty;
// };

const AttendanceSheet: React.FC<Props> = ({ customers, intervals, date }) => {
  // const customersGroupedByInterval = groupCustomersByAttendedInterval(
  //   intervals,
  //   customers
  // );

  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>
              Attendance for {fb2Luxon(date).toFormat("EEEE dd-MM-y")}
            </TableCell>
          </TableRow>
        </TableHead>
        {Object.keys(intervals).map((interval) => (
          <TableBody>
            <TableRow key={interval}>
              <TableCell component="th" scope="row">
                {interval}
              </TableCell>
            </TableRow>
            {customers.map(
              (customer) =>
                customer.bookedInterval === interval && (
                  <TableRow key={123}>
                    <TableCell>{customer.name}</TableCell>
                  </TableRow>
                )
            )}
          </TableBody>
        ))}
      </Table>
    </TableContainer>
  );
};
export default AttendanceSheet;
