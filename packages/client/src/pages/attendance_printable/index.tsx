import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { luxon2ISODate, OrgSubCollection } from "@eisbuk/shared";
import { Button, CalendarNav, Layout } from "@eisbuk/ui";
import { useTranslation, NavigationLabel } from "@eisbuk/translations";
import { Printer } from "@eisbuk/svg";

import { AttendanceSortBy } from "@/enums/other";

import AttendanceSheet, {
  AttendanceSheetSlot,
} from "@/components/atoms/AttendanceSheet";
import { NotificationsContainer } from "@/features/notifications/components";

import useTitle from "@/hooks/useTitle";
import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";

import { getCalendarDay } from "@/store/selectors/app";
import { getSlotsWithAttendance } from "@/store/selectors/attendance";

import { changeCalendarDate } from "@/store/actions/appActions";

import { adminLinks } from "@/data/navigation";

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch();
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
    <Button
      onClick={() => window.print()}
      className="h-8 w-8 !p-[2px] rounded-full text-gray-700 hover:bg-black/10"
    >
      <Printer />
    </Button>
  );

  // add a semantically correct HTML title as it
  // is used for default filename
  useTitle(
    `${t(NavigationLabel.Attendance).toLowerCase()}-${luxon2ISODate(date)}`
  );

  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
    >
      <CalendarNav
        className="print:hidden"
        onChange={(date) => dispatch(changeCalendarDate(date))}
        date={date}
        jump="day"
        additionalContent={printButton}
      />
      <AttendanceSheet date={date}>
        {attendanceSlots.map(
          (slot) =>
            slot.customers.length > 0 && <AttendanceSheetSlot {...slot} />
        )}
      </AttendanceSheet>
    </Layout>
  );
};

export default DashboardPage;
