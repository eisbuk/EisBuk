import React from "react";
import { DateTime } from "luxon";
import { useSelector } from "react-redux";

import TableContainer from "@mui/material/TableContainer";

import TableRow from "@mui/material/TableRow";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import Paper from "@mui/material/Paper";

import makeStyles from "@mui/styles/makeStyles";

import { getOrganizationSettings } from "@/store/selectors/app";
import { organizationInfo } from "@/themes";

import {
  useTranslation,
  DateFormat,
  PrintableAttendance,
} from "@eisbuk/translations";
import { SlotType } from "@eisbuk/shared";

export interface Props {
  date: DateTime;
}

const AttendanceSheet: React.FC<Props> = ({ date, children }) => {
  const { t } = useTranslation();
  const { displayName } = useSelector(getOrganizationSettings) || "";
  const { theme } = organizationInfo;
  const classes = useStyles();

  return (
    <>
      <h2 className={classes.flexCenter}>{displayName || ""}</h2>
      <div className={classes.title}>
        <span className={classes.date}>
          {`${t(DateFormat.Date)}: ${t(DateFormat.FullWithWeekday, { date })}`}
        </span>

        <span
          style={{
            backgroundColor: theme.palette.ice,
            printColorAdjust: "exact",
          }}
          className={classes.iceLegend}
        >
          {SlotType.Ice}
        </span>
        <span
          style={{
            backgroundColor: theme.palette.offIce,
          }}
          className={classes.offIceLegend}
        >
          {SlotType.OffIce}
        </span>
      </div>
      <TableContainer className={classes.tableContainer} component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow className={classes.heading}>
              <TableCell align="center" className={classes.tableCell}>
                {t(PrintableAttendance.Start)}
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                {t(PrintableAttendance.End)}
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                {t(PrintableAttendance.TotalHours)}
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                {t(PrintableAttendance.Note)}
              </TableCell>
              <TableCell align="center" className={classes.tableCell}>
                {t(PrintableAttendance.Trainer)}
              </TableCell>
              <TableCell align="center" className={classes.wideCell}>
                {t(PrintableAttendance.Athlete)}
              </TableCell>
              <TableCell align="center" className={classes.wideCell}>
                {t(PrintableAttendance.Signature)}
              </TableCell>
              <TableCell align="center" className={classes.wideCell}>
                {t(PrintableAttendance.Note)}
              </TableCell>
            </TableRow>
          </TableHead>
          {children}
        </Table>
      </TableContainer>
    </>
  );
};
const useStyles = makeStyles((theme) => ({
  title: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 600,
    background: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.contrastText,
  },
  date: {
    marginRight: "5rem",
    "@media print": {
      color: "black",
    },
  },
  iceLegend: {
    margin: "0.25rem",
    padding: "0.25rem 0.5rem",
    borderRadius: "1rem",
    fontWeight: "bold",
    "@media print": {
      printColorAdjust: "exact",
    },
  },
  offIceLegend: {
    margin: "0.25rem",
    padding: "0.25rem 0.5rem",
    borderRadius: "1rem",
    fontWeight: "bold",
    "@media print": {
      printColorAdjust: "exact",
    },
  },
  flexCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    "@media print": {
      margin: "0px",
    },
  },
  tableCell: {
    borderWidth: "1px 2px 2px 1px",
    border: "solid rgba(0, 0, 0, 0.2)",
    padding: "0px",
    minWidth: "3.5rem",
  },
  heading: {
    border: "3px solid rgba(224, 224, 224, 224)",
  },
  tableContainer: {
    borderWidth: "1px 1px 1px 1px",
    border: "solid rgba(0, 0, 0, 0.2)",
  },
  wideCell: {
    width: "20rem",
    wordWrap: "break-word",
    borderWidth: "1px 2px 2px 1px",
    border: "solid rgba(0, 0, 0, 0.2)",
    padding: "0px",
  },
}));
export default AttendanceSheet;
