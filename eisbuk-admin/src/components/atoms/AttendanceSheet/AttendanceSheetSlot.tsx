import React from "react";
import { useTranslation } from "react-i18next";

import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import Table from "@material-ui/core/Table";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotInterface } from "eisbuk-shared";
import { CustomerWithAttendance } from "@/types/components";

import { getSlotTimespan } from "@/utils/helpers";
import Box from "@material-ui/core/Box";
import ProjectIcon from "@/components/global/ProjectIcons";
import Typography from "@material-ui/core/Typography";

import { slotsLabels } from "@/config/appConfig";
import {
  slotTypeLabel,
} from "@/lib/labels";
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
  const { t } = useTranslation();

  const slotLabel = slotsLabels.types[type];

  const timeString = getSlotTimespan(intervals);

  /** UI todos:
   * @TODO in page component render alternative background shades for slot table
   * @TODO center each slot timestring (different width percentages for table cells doesn't work)
   */
  return (
    <Table aria-label="simple table">
      <TableHead>
        <TableRow className={classes.slotHeading}>
          <TableCell className={classes.bold}>
            <span className={classes.margins}>{timeString} </span>
          </TableCell>
          <TableCell>
            <Box
              className={[classes.flexCenter, classes.typeLabel].join(" ")}
              flexGrow={1}
              pl={1}
              pr={1}
            >
              <ProjectIcon
                className={classes.typeIcon}
                icon={slotLabel.icon}
                fontSize="small"
              />
              <Typography
                className={classes.type}
                key="type"
                color={slotLabel.color}
              >
                {t(slotTypeLabel[type])}
              </Typography>
            </Box>
            {notes && <span className={classes.flexCenter}> ({notes})</span>}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody className={classes.tableRow}>
        {Object.keys(intervals).map((interval) => (
          <React.Fragment key={interval}>
            <TableRow className={classes.tableRow}>
              <TableCell component="th" scope="row">
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
const useStyles = makeStyles((theme) => ({
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
    color: theme.palette.grey[600],
  },
  margins: {
    margin: 10
  },
  typeIcon: {
    opacity: 0.5,
  },
  type: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
  },
  flexCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  typeLabel: {
    height: "100%",
  },
  boxCenter: {
    width: "100%",
  },
  boxLeft: {
    boxSizing: "border-box",
    width: "50%",
    marginRight: "auto",
  },
}));
// #endregion Styles//
export default AttendanceSheetSlot;
