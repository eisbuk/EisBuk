import React, { useState } from "react";
import { Link } from "react-router-dom";

import { DateTime } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import {
  CalendarNav,
  TabItem,
  CalendarNavProps,
  Button,
  LayoutContent,
} from "@eisbuk/ui";
import { Calendar, Printer } from "@eisbuk/svg";
import { OrgSubCollection } from "@eisbuk/shared";
import i18n, { AttendanceNavigationLabel } from "@eisbuk/translations";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import ErrorBoundary from "@/components/atoms/ErrorBoundary";

import { getOrganization } from "@/lib/getters";

import ByDayView from "./views/ByDay";
import ByMonthView from "./views/ByMonth";

import AdminBar from "@/controllers/AdminBar";
import { NotificationsContainer } from "@/features/notifications/components";

import { getCalendarDay } from "@/store/selectors/app";

import { changeCalendarDate } from "@/store/actions/appActions";

enum Views {
  ByDay = "ByDayView",
  ByMonth = "ByMonthView",
}

// Get appropriate view to render
const viewsLookup = {
  [Views.ByDay]: (resetKeys: Array<any>) => () =>
  (
    <LayoutContent>
      <ErrorBoundary resetKeys={[resetKeys]}>
        <ByDayView />
      </ErrorBoundary>
    </LayoutContent>
  ),
  [Views.ByMonth]: (resetKeys: Array<any>) => () =>
  (
    <LayoutContent wide>
      <ErrorBoundary resetKeys={[resetKeys]}>
        <MonthWrapper>
          <ByMonthView />
        </MonthWrapper>
      </ErrorBoundary>
    </LayoutContent>
  ),
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

  const calendarNavProps = useDate();
  const [view, setView] = useState<keyof typeof viewsLookup>(Views.ByDay);
  const AttendanceView = viewsLookup[view]([calendarNavProps]);

  const calendarJump = view === Views.ByDay ? "day" : "month";
  const calendarAdditionalContent =
    view === Views.ByDay ? (
      <Link className="hidden md:block" to="/attendance_printable">
        <Button className="h-8 w-8 !p-[2px] rounded-full text-gray-700 hover:bg-black/10">
          <Printer />
        </Button>
      </Link>
    ) : undefined;

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

  const additionalButtonsSM = (
    <>
      <button
        key="by-day-view-button"
        onClick={() => setView(Views.ByDay)}
        className={`w-24 rounded-2xl px-2 py-0.5 border overflow-hidden ${view === Views.ByDay ? "bg-cyan-700 text-white" : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"}`}
      >{i18n.t(AttendanceNavigationLabel.Day)}</button>
      <button
        key="by-month-view-button"
        onClick={() => setView(Views.ByMonth)}
        className={`w-24 rounded-2xl px-2 py-0.5 border overflow-hidden ${view === Views.ByMonth ? "bg-cyan-700 text-white" : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"}`}
      >{i18n.t(AttendanceNavigationLabel.Month)}</button>
    </>
  );

  return (
    <div className="absolute top-0 right-0 left-0 flex flex-col pt-[141px] md:pt-[272px]">
      <header className="fixed left-0 top-0 right-0 bg-gray-800 z-50">
        <div className="content-container">
          <AdminBar className="flex w-full h-[70px] py-[15px] justify-between items-center print:hidden" />

          <div className="hidden w-full h-[70px] py-[15px] justify-between items-center md:flex print:hidden">
            <div>{null}</div>
            {null}
          </div>

          <div className="w-full h-[2px] bg-gray-700" />

          <div className="hidden w-full py-[15px] justify-between items-center h-[70px] md:flex print:hidden">
            <div className="w-full flex justify-center items-center gap-4 md:gap-3 md:justify-start md:max-w-1/2">
              {additionalButtons}
            </div>

            <div className="hidden md:block md:w-full">
              <NotificationsContainer className="w-full md:w-auto" />
            </div>
          </div>
        </div>
      </header>

      <div className="fixed left-0 top-[72px] right-0 border-b border-gray-400 z-40 md:border-none md:top-[212px]" >
        <CalendarNav
          {...calendarNavProps}
          jump={calendarJump}
          additionalContent={calendarAdditionalContent}
        />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 flex items-center gap-2 md:hidden">
          {additionalButtonsSM}
        </div>
      </div>

      <AttendanceView />

      <div className={`fixed px-4 ${view === Views.ByDay ? "bottom-[70px]" : "bottom-4"} right-0 z-40 md:hidden`}>
        <NotificationsContainer />
      </div>
    </div>
  );
};

export default AttendancePage;

// NOTE: This is a quick fix to allow table header cells to be sticky.
// Scroll of main content wrapper conflicts with this behaviour.
// A better fix means an overhaul of parent or table cell css:
//* overflow does not play well with position:sticky
const MonthWrapper: React.FC = ({ children }) => (
  <div className="overflow-x-auto h-full pb-10 scrollbar-hide">
    <div className="px-[44px] py-4">{children}</div>
  </div>
);
