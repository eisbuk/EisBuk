import React from "react";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import Table from "@material-ui/core/Table";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import { CustomerWithAttendance, SlotInterface } from "@/types/temp";

export interface Props extends SlotInterface {
  /**
   * Record of customers who have booked (or are manually as attended),
   * keyed by `customerId` and having all of the data for the customer plus
   * values for `bookedInterval` and `attendedInterval`.
   */
  customers: CustomerWithAttendance[];
}

/** @TODO slot type and notes in a <TableHead/> */
const AttendanceSheetSlot: React.FC<Props> = ({
  customers,
  intervals,
  type,
  notes,
}) => {
  return (
    <Table aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell>
            {type} {notes}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.keys(intervals).map((interval) => (
          <React.Fragment>
            <TableRow>
              <TableCell component="th" scope="row">
                {interval}
              </TableCell>
            </TableRow>
            {customers.map(
              (customer) =>
                customer.attendedInterval === interval && (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                  </TableRow>
                )
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};
export default AttendanceSheetSlot;
