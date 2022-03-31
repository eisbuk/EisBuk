import React from "react";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";

import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";

import makeStyles from "@mui/styles/makeStyles";

import { DateFormat, NavigationLabel } from "@/enums/translations";

export interface Props {
  date: DateTime;
}

const AttendanceSheet: React.FC<Props> = ({ date, children }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  return (
    <>
      <div className={classes.title}>
        <span>{t(NavigationLabel.Attendance)}</span>
        <span className={classes.date}>{t(DateFormat.Full, { date })}</span>
      </div>
      <TableContainer component={Paper}>{children}</TableContainer>
    </>
  );
};
const useStyles = makeStyles((theme) => ({
  title: {
    position: "relative",
    fontWeight: 600,
    padding: 20,
    background: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.contrastText,
  },
  date: {
    position: "absolute",
    right: "2rem",
  },
}));
export default AttendanceSheet;