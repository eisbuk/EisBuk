import React from "react";

import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";

import makeStyles from "@mui/styles/makeStyles";
import createStyles from "@mui/styles/createStyles";

import { SlotInterface, SlotType } from "@eisbuk/shared";

import { CustomerWithAttendance } from "@/types/components";

import { getColorForSlotType } from "@/utils/theme";
import { calculateIntervalDuration } from "../BookingCard/Duration";
import { Divider } from "@mui/material";

interface Props extends SlotInterface {
  customers: CustomerWithAttendance[];
}

const AttendanceSheetSlot: React.FC<Props> = ({ customers, type, notes }) => {
  const typeColor = getColorForSlotType(type);
  const classes = useStyles(typeColor);

  return (
    <TableBody>
      {Object.values(customers).map((customer) => {
        const bookedStartTime = customer.bookedInterval?.substring(0, 5);
        const bookedEndTime = customer.bookedInterval?.substring(6, 11);
        const attendedStartTime = customer.attendedInterval?.substring(0, 5);
        const attendedEndTime = customer.attendedInterval?.substring(6, 11);

        const bookedTotalHours = calculateIntervalDuration(
          bookedStartTime || "",
          bookedEndTime || ""
        );
        const attendedTotalHours = calculateIntervalDuration(
          attendedStartTime || "",
          attendedEndTime || ""
        );

        return (
          <TableRow
            key={customer.id}
            style={{ backgroundColor: typeColor }}
            className={classes.tableCell}
          >
            <TableCell
              align="center"
              size="small"
              className={
                type === SlotType.Ice
                  ? classes.iceInterval
                  : classes.offIceInterval
              }
            >
              {bookedStartTime || attendedStartTime}
            </TableCell>
            <TableCell
              align="center"
              className={
                type === SlotType.Ice
                  ? classes.iceInterval
                  : classes.offIceInterval
              }
            >
              {bookedEndTime || attendedEndTime}
            </TableCell>
            <TableCell align="center" className={classes.tableCell}>
              {bookedTotalHours || attendedTotalHours}
            </TableCell>
            <TableCell align="center" className={classes.tableCell}>
              {notes}
            </TableCell>
            <TableCell align="center" className={classes.tableCell}>
              {}
            </TableCell>
            <TableCell
              align="center"
              className={classes.tableCell}
            >{`${customer.name} ${customer.surname}`}</TableCell>
            <TableCell align="center" className={classes.tableCell}>
              {}
            </TableCell>
            <TableCell align="center" className={classes.tableCell}>
              {}
            </TableCell>
          </TableRow>
        );
      })}
      <Divider className={classes.divider} component="tr" />
    </TableBody>
  );
};

// #region styles
const useStyles = makeStyles(() =>
  createStyles({
    divider: {
      borderWidth: "0.3rem",
      borderColor: "rgba(255, 255, 255, 1)",
    },
    tableCell: {
      border: "solid rgba(0, 0, 0, 0.2)",
      borderWidth: "2px 2px 5px 2px",
      padding: "0px",
    },
    iceInterval: {
      border: "solid rgba(0, 0, 0, 0.2)",
      borderWidth: "2px 2px 2px 2px",
      backgroundColor: "#42a5f5",
      padding: "0px",

      "@media print": {
        border: "solid rgba(0, 0, 0, 0.2)",
        borderWidth: "2px 2px 5px 2px",
        backgroundColor: "#42a5f5",
        printColorAdjust: "exact",
      },
    },
    offIceInterval: {
      border: "solid rgba(0, 0, 0, 0.2)",
      borderWidth: "2px 2px 2px 2px",
      backgroundColor: "#ffa726",
      padding: "0px",

      "@media print": {
        border: "solid rgba(0, 0, 0, 0.2)",
        borderWidth: "2px 2px 2px 2px",
        backgroundColor: "#ffa726",
        printColorAdjust: "exact",
      },
    },
  })
);

// #endregion styles

export default AttendanceSheetSlot;
