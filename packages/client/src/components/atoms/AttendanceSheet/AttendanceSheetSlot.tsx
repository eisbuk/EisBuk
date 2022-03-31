import React from "react";

import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";

import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

import { SlotInterface } from "@eisbuk/shared";

import { CustomerWithAttendance } from "@/types/components";

import SlotTypeIcon from "@/components/atoms/SlotTypeIcon";

import { getSlotTimespan } from "@/utils/helpers";

interface Props extends SlotInterface {
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

  return (
    <Table aria-label="simple table">
      <TableHead>
        <TableRow className={classes.heading}>
          <TableCell className={[classes.bold, classes.tableCell].join(" ")}>
            {timeString}
          </TableCell>
          <TableCell className={classes.tableCell}>
            <SlotTypeIcon className={classes.typeLabel} {...{ type }} />
            {notes && <span className={classes.flexCenter}> ({notes})</span>}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody className={classes.tableRow}>
        {Object.keys(intervals).map((interval) => (
          <React.Fragment key={interval}>
            <TableRow className={classes.tableRow}>
              <TableCell component="th" scope="row" colSpan={2}>
                {intervals[interval].startTime} - {intervals[interval].endTime}
              </TableCell>
            </TableRow>
            {customers.map(
              (customer) =>
                customer.bookedInterval === interval && (
                  <TableRow key={customer.id}>
                    <TableCell
                      className={[classes.tableCell, classes.customerName].join(
                        " "
                      )}
                    >
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

// #region styles
const useStyles = makeStyles((theme) =>
  createStyles({
    // general
    tableRow: {
      borderBottom: "1px solid rgba(224, 224, 224, 1)",
      paddingRight: 0,
    },
    bold: {
      fontWeight: 600,
      color: "black",
    },
    flexCenter: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    tableCell: {
      width: "50%",
    },
    // heading
    heading: {
      border: "3px solid rgba(224, 224, 224, 1)",
    },
    typeLabel: {
      height: "100%",
      flexGrow: 1,
      padding: `0 ${theme.spacing(1)}`,
    },
    // table body
    customerName: {
      borderRight: "1px solid rgba(224, 224, 224, 1)",
      color: theme.palette.grey[600],
    },
  })
);

// #endregion styles

export default AttendanceSheetSlot;
