import React from "react";
import { useTranslation } from "react-i18next";

import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import Table from "@material-ui/core/Table";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { SlotInterface } from "eisbuk-shared";

import { slotsLabels } from "@/config/appConfig";

import { slotTypeLabel } from "@/lib/labels";

import { CustomerWithAttendance } from "@/types/components";

import ProjectIcon from "@/components/global/ProjectIcons";

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
  const { t } = useTranslation();

  const slotLabel = slotsLabels.types[type];

  const timeString = getSlotTimespan(intervals);

  return (
    <Table aria-label="simple table">
      <TableHead>
        <TableRow className={classes.heading}>
          <TableCell className={[classes.bold, classes.tableCell].join(" ")}>
            {timeString}
          </TableCell>
          <TableCell className={classes.tableCell}>
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
const useStyles = makeStyles((theme) => ({
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
  type: {
    textTransform: "uppercase",
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.pxToRem(10),
  },
  typeLabel: {
    height: "100%",
  },
  typeIcon: {
    opacity: 0.5,
  },
  // table body
  customerName: {
    borderRight: "1px solid rgba(224, 224, 224, 1)",
    color: theme.palette.grey[600],
  },
}));

// #endregion styles

export default AttendanceSheetSlot;
