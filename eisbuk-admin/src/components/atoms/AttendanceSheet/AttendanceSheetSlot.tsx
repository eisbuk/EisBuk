import React from "react";

import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import Table from "@material-ui/core/Table";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { CustomerWithAttendance, SlotInterface } from "@/types/temp";

import { getSlotTimespan } from "@/utils/helpers";

/** @TODO remove this and import same type when it's merged*/
export interface Props extends SlotInterface {
  /**
   * Record of customers who have booked (or are manually as attended),
   * keyed by `customerId` and having all of the data for the customer plus
   * values for `bookedInterval` and `attendedInterval`.
   */
  customers: CustomerWithAttendance[];
}

const AttendanceSheetSlot: React.FC<Props> = ({
  customers,
  intervals,
  type,
  notes,
}) => {
  const classes = useStyles();

  const timeString = getSlotTimespan(intervals);

  /** UI todos:
   * @TODO in page component render alternative background shades for slot table
   * @TODO center each slot timestring (different width percentages for table cells doesn't work)
   */
  return (
    <Table aria-label="simple table">
      <TableHead>
        <TableRow className={classes.slotHeading}>
          <TableCell className={classes.slotHeadingCell}>
            <span>{timeString} </span>
            <span className={classes.bold}> {type.toUpperCase()}</span>
            <span>{notes}</span>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody className={classes.tableRow}>
        {Object.keys(intervals).map((interval) => (
          <React.Fragment key={interval}>
            <TableRow className={classes.tableRow}>
              <TableCell className={classes.bold} component="th" scope="row">
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
                    <TableCell />
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
  slotHeading: {
    border: "3px solid rgba(224, 224, 224, 1)",
  },
  tableRow: {
    borderBottom: "1px solid rgba(224, 224, 224, 1)",
    paddingRight: 0,
  },
  bold: {
    fontWeight: 600,
  },
  tableCell: {
    borderRight: "1px solid rgba(224, 224, 224, 1)",
    width: "50%",
  },
}));
// #endregion Styles//
export default AttendanceSheetSlot;
