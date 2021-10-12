import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Container from "@material-ui/core/Container";
import IconButton from "@material-ui/core/IconButton";

import makeStyles from "@material-ui/core/styles/makeStyles";

import PrintIcon from "@material-ui/icons/Print";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import DateNavigation from "@/components/atoms/DateNavigation";
import AttendanceSheet, {
  AttendanceSheetSlot,
} from "@/components/atoms/AttendanceSheet";

import useTitle from "@/hooks/useTitle";

import { getCalendarDay } from "@/store/selectors/app";
import { getSlotsWithAttendance } from "@/store/selectors/attendance";

import { luxon2ISODate } from "@/utils/date";

const DashboardPage: React.FC = () => {
  const classes = useStyles();
  const { t } = useTranslation();

  const attendanceSlots = useSelector(getSlotsWithAttendance);

  const date = useSelector(getCalendarDay);

  /**
   * This button, unlike the one in attendance page doesn't link
   * but initiates `window.print` which is very similar (99%) to
   * `Ctrl` + `P` print shortcut.
   */
  const printButton = (
    <IconButton onClick={() => window.print()}>
      <PrintIcon />
    </IconButton>
  );

  // add a semantically correct HTML title as it
  // is used for default filename
  useTitle(
    `${t("AttendanceSheet.Attendance").toLowerCase()}-${luxon2ISODate(date)}`
  );

  return (
    <>
      <AppbarAdmin className={classes.noPrint} />
      <DateNavigation
        className={classes.noPrint}
        jump="day"
        extraButtons={printButton}
      >
        {() => (
          <Container maxWidth="sm">
            <AttendanceSheet date={date}>
              {attendanceSlots.map((slot) => (
                <AttendanceSheetSlot {...slot} />
              ))}
            </AttendanceSheet>
          </Container>
        )}
      </DateNavigation>
    </>
  );
};

const useStyles = makeStyles(() => ({
  noPrint: {
    "@media print": {
      display: "none",
    },
  },
}));

export default DashboardPage;
