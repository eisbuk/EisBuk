import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { luxon2ISODate, OrgSubCollection } from "@eisbuk/shared";
import { AttendanceSheet, Button, CalendarNav, Layout } from "@eisbuk/ui";
import { useTranslation, NavigationLabel } from "@eisbuk/translations";
import { Printer } from "@eisbuk/svg";

import { getOrganization } from "@/lib/getters";

import BirthdayMenu from "@/controllers/BirthdayMenu";
import AthletesApproval from "@/controllers/AthletesApproval";
import { NotificationsContainer } from "@/features/notifications/components";

import useTitle from "@/hooks/useTitle";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { getCalendarDay } from "@/store/selectors/app";
import { getSlotsWithAttendance } from "@/store/selectors/attendance";

import { changeCalendarDate } from "@/store/actions/appActions";

import { adminLinks } from "@/data/navigation";
import { getOrgDisplayName } from "@/store/selectors/orgInfo";

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Attendance },
    { collection: OrgSubCollection.Customers },
    { collection: OrgSubCollection.SlotsByDay },
  ]);

  const date = useSelector(getCalendarDay);

  const organizationName = useSelector(getOrgDisplayName);
  const attendanceSlots = useSelector(getSlotsWithAttendance);

  const additionalAdminContent = (
    <React.Fragment>
      <BirthdayMenu />
      <AthletesApproval />
    </React.Fragment>
  );
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
      additionalAdminContent={additionalAdminContent}
    >
      <CalendarNav
        className="print:hidden"
        onChange={(date) => dispatch(changeCalendarDate(date))}
        date={date}
        jump="day"
        additionalContent={printButton}
      />
      <div className="content-container">
        <AttendanceSheet
          date={date}
          data={attendanceSlots}
          organizationName={organizationName}
        />
      </div>
    </Layout>
  );
};

export default DashboardPage;
