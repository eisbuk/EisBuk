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

/**
 * function that calculates start and end time for slot
 * @param intervals - slot intervals array
 * @returns overallInterval - { firstStartTime, lastEndTime}
 */
const getTimeString = (intervals: SlotInterval[]): string => {
  return `${intervals[0].startTime} - ${
    intervals[intervals.length - 1].endTime
  }`;
};

const AttendanceSheetSlot: React.FC<Props> = ({
  customers,
  intervals,
  type,
  notes,
}) => {
  const classes = useStyles();

  const timeString = getTimeString(Object.values(intervals));

  /** UI todos:
   * @TODO in page component render alternative background shades for slot table
   * @TODO center each slot timestring
   * @TODO justify spaces in rows with 2 columns (name cell is much bigger than signature cell)
   *
   */
  return (
    <Table aria-label="simple table">
      <TableHead className={classes.timeString}>
        <TableRow>
          <TableCell>
            {timeString} {type.toUpperCase()}
            {notes}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody className={classes.tableRow}>
        {Object.keys(intervals).map((interval) => (
          <React.Fragment key={interval}>
            <TableRow>
              <TableCell
                className={classes.intervalHead}
                component="th"
                scope="row"
              >
                {intervals[interval].startTime} - {intervals[interval].endTime}
              </TableCell>
            </TableRow>
            {customers.map(
              (customer) =>
                customer.attendedInterval === interval && (
                  <TableRow key={customer.id}>
                    <TableCell className={classes.tableCell}>
                      {customer.name} {customer.surname}
                    </TableCell>
                    <TableCell></TableCell>
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
const useStyles = makeStyles(() => ({
  timeString: {
    "& .MuiTableRow-root": {
      // outline: "auto",
      border: "3px solid rgba(224, 224, 224, 1)",
      // borderTop: "5px solid rgba(224, 224, 224, 1)",
    },
  },
  tableRow: {
    "& .MuiTableRow-root": {
      // outline: "auto",
      borderBottom: "1px solid rgba(224, 224, 224, 1)",
    },
  },
  intervalHead: {
    fontWeight: 600,
  },
  tableCell: {
    borderRight: "1px solid rgba(224, 224, 224, 1)",
  },
}));
// #endregion Styles//
export default AttendanceSheetSlot;
