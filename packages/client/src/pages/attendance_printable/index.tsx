import React from "react";
import { useSelector } from "react-redux";

import { luxon2ISODate, OrgSubCollection } from "@eisbuk/shared";

import IconButton from "@mui/material/IconButton";

import makeStyles from "@mui/styles/makeStyles";

import PrintIcon from "@mui/icons-material/Print";

import { useTranslation, NavigationLabel } from "@eisbuk/translations";

import AppbarAdmin from "@/components/layout/AppbarAdmin";
import DateNavigation from "@/components/atoms/DateNavigation";
import AttendanceSheet, {
  AttendanceSheetSlot,
} from "@/components/atoms/AttendanceSheet";

import useTitle from "@/hooks/useTitle";
import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";

import { getCalendarDay } from "@/store/selectors/app";
import { getSlotsWithAttendance } from "@/store/selectors/attendance";
import { AttendanceSortBy } from "@/enums/other";

const DashboardPage: React.FC = () => {
  const classes = useStyles();
  const { t } = useTranslation();

  useFirestoreSubscribe([
    OrgSubCollection.Attendance,
    OrgSubCollection.Customers,
    OrgSubCollection.SlotsByDay,
  ]);

  const attendanceSlots = useSelector(
    getSlotsWithAttendance(AttendanceSortBy.BookedInterval)
  );

  const date = useSelector(getCalendarDay);

  /**
   * This button, unlike the one in attendance page doesn't link
   * but initiates `window.print` which is very similar (99%) to
   * `Ctrl` + `P` print shortcut.
   */
  const printButton = (
    <IconButton onClick={() => window.print()} size="large">
      <PrintIcon />
    </IconButton>
  );

  // add a semantically correct HTML title as it
  // is used for default filename
  useTitle(
    `${t(NavigationLabel.Attendance).toLowerCase()}-${luxon2ISODate(date)}`
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
          <AttendanceSheet date={date}>
            {attendanceSlots.map(
              (slot) =>
                slot.customers.length > 0 && <AttendanceSheetSlot {...slot} />
            )}
          </AttendanceSheet>
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
