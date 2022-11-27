import React, { useState } from "react";
import { Link } from "react-router-dom";

import { DateTime } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import {
  CalendarNav,
  Layout,
  TabItem,
  CalendarNavProps,
  Button,
} from "@eisbuk/ui";
import { Calendar, Printer } from "@eisbuk/svg";
import { OrgSubCollection } from "@eisbuk/shared";
import i18n, { AttendanceNavigationLabel } from "@eisbuk/translations";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { getOrganization } from "@/lib/getters";

import ByDayView from "./views/ByDay";
import ByMonthView from "./views/ByMonth";

import { NotificationsContainer } from "@/features/notifications/components";
import BirthdayMenu from "@/components/atoms/BirthdayMenu";

import { getCustomersByBirthday } from "@/store/selectors/customers";
import { getCalendarDay } from "@/store/selectors/app";

import { changeCalendarDate } from "@/store/actions/appActions";

import { adminLinks } from "@/data/navigation";

enum Views {
  ByDay = "ByDayView",
  ByMonth = "ByMonthView",
}

// Get appropriate view to render
const viewsLookup = {
  [Views.ByDay]: ByDayView,
  [Views.ByMonth]: ByMonthView,
};

// TODO: This is duplicated in `customer_area` local hooks file => lift out
/**
 * Date logic abstracted away in a hook for readability.
 * Reads current date from Redux store and handles updates of the current date.
 * The returned structure can directly be passed as props to CalendarNav component
 */
const useDate = (): Pick<CalendarNavProps, "date" | "onChange"> => {
  const dispatch = useDispatch();

  const date = useSelector(getCalendarDay);
  const onChange = (date: DateTime) => dispatch(changeCalendarDate(date));

  return { date, onChange };
};

/**
 * Customer area page component
 */
const AttendancePage: React.FC = () => {
  // Subscribe to necessary collections
  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.Attendance },
    { collection: OrgSubCollection.Customers },
    { collection: OrgSubCollection.SlotsByDay },
  ]);

  const [view, setView] = useState<keyof typeof viewsLookup>(Views.ByDay);
  const AttendanceView = viewsLookup[view];

  const calendarNavProps = useDate();
  const calendarJump = view === Views.ByDay ? "day" : "month";
  const calendarAdditionalContent =
    view === Views.ByDay ? (
      <Link to="/attendance_printable">
        <Button className="h-8 w-8 !p-[2px] rounded-full text-gray-700 hover:bg-black/10">
          <Printer />
        </Button>
      </Link>
    ) : undefined;

  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );

  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

  const additionalButtons = (
    <>
      <TabItem
        key="by-day-view-button"
        Icon={Calendar as any}
        label={i18n.t(AttendanceNavigationLabel.Day)}
        onClick={() => setView(Views.ByDay)}
        active={view === Views.ByDay}
      />
      <TabItem
        key="by-month-view-button"
        Icon={Calendar as any}
        label={i18n.t(AttendanceNavigationLabel.Month)}
        onClick={() => setView(Views.ByMonth)}
        active={view === Views.ByMonth}
      />
    </>
  );

  return (
    <Layout
      isAdmin
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalAdminContent={additionalAdminContent}
      additionalButtons={additionalButtons}
    >
      <CalendarNav
        {...calendarNavProps}
        jump={calendarJump}
        additionalContent={calendarAdditionalContent}
      />
      {view === Views.ByDay ? (
        <AttendanceView />
      ) : (
        <MonthWrapper>
          <AttendanceView />
        </MonthWrapper>
      )}
    </Layout>
  );
};

export default AttendancePage;

// NOTE: This is a quick fix to allow table header cells to be sticky.
// Scroll of main content wrapper conflicts with this behaviour.
// A better fix means an overhaul of parent or table cell css:
//* overflow does not play well with position:sticky
const MonthWrapper: React.FC = ({ children }) => (
  <div className="overflow-x-auto h-4/5 pb-32 scrollbar-hide">
    <div className="px-[44px] py-4">{children}</div>
  </div>
);