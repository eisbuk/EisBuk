import React from "react";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

export interface Props {
  date: DateTime;
}

const AttendanceSheet: React.FC<Props> = ({ date, children }) => {
  const { t } = useTranslation();

  return (
    <TableContainer component={Paper}>
      <div>{t("AttendanceSheet.Date", { date: date })}</div>

      {children}
    </TableContainer>
  );
};
export default AttendanceSheet;
