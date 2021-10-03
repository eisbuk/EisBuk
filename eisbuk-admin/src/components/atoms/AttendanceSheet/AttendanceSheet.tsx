import React from "react";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import makeStyles from "@material-ui/core/styles/makeStyles";

export interface Props {
  date: DateTime;
}

const AttendanceSheet: React.FC<Props> = ({ date, children }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  return (
    <>
      <div className={classes.title}>{t("AttendanceSheet.Date", { date })}</div>
      <TableContainer component={Paper}>{children}</TableContainer>
    </>
  );
};
// #region Styles//
const useStyles = makeStyles((theme) => ({
  title: {
    padding: 20,
    background: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
  },
}));
// #endregion Styles//
export default AttendanceSheet;
