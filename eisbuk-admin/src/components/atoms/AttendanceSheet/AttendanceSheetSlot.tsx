import React from "react";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import Table from "@material-ui/core/Table";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import {
  CustomerWithAttendance,
  SlotInterface,
  SlotInterval,
} from "@/types/temp";
import makeStyles from "@material-ui/core/styles/makeStyles";

/** @TODO remove this and import same type when it's merged*/
export interface Props extends SlotInterface {
  /**
   * Record of customers who have booked (or are manually as attended),
   * keyed by `customerId` and having all of the data for the customer plus
   * values for `bookedInterval` and `attendedInterval`.
   */
  customers: CustomerWithAttendance[];
}

/** function that calculates start and end time for slot
 * @param intervals - slot intervals array
 * @returns overallInterval - { firstStartTime, lastEndTime}
 */
const getOverallInterval = (
  intervals: SlotInterval[]
): {
  overallStartTime: string;
  overallEndTime: string;
} => {
  return {
    overallStartTime: intervals[0].startTime,
    overallEndTime: intervals[intervals.length - 1].endTime,
  };
};
const AttendanceSheetSlot: React.FC<Props> = ({
  customers,
  intervals,
  type,
  notes,
}) => {
  const classes = useStyles();

  const overallInterval = getOverallInterval(Object.values(intervals));

  return (
    <Table aria-label="simple table">
      <TableHead>
        <TableRow className={classes.root}>
          <TableCell>
            {overallInterval.overallStartTime} -{" "}
            {overallInterval.overallEndTime} {type.toUpperCase()}
            {notes}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.keys(intervals).map((interval) => (
          <React.Fragment key={interval}>
            <TableRow>
              <TableCell component="th" scope="row">
                {interval}
              </TableCell>
            </TableRow>
            {customers.map(
              (customer) =>
                customer.attendedInterval === interval && (
                  <TableRow key={customer.id}>
                    <TableCell>
                      {customer.name} {customer.surname}
                    </TableCell>
                  </TableRow>
                )
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

// #region Styles//
const useStyles = makeStyles((theme) => ({
  root: {
    "& .MuiTableRow-root": {
      borderWidth: "20px",
    },
  },
}));
// #endregion Styles//
export default AttendanceSheetSlot;
