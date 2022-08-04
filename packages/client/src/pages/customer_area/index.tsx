import React, { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { CalendarNav, CalendarNavProps, Layout, TabItem } from "@eisbuk/ui";
import { Calendar, AccountCircle } from "@eisbuk/svg";
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";

import BookView from "./views/Book";
import CalendarView from "./views/Calendar";
import { NotificationsContainer } from "@/features/notifications/components";
import AddToCalendar from "@/components/atoms/AddToCalendar";

import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";
import {
  getBookedSlotsByMonth,
  getBookingsCustomer,
  getSlotsForCustomer,
} from "@/store/selectors/bookings";
import { getCalendarDay } from "@/store/selectors/app";
import { getIsAdmin } from "@/store/selectors/auth";
import { changeCalendarDate } from "@/store/actions/appActions";

import { setSecretKey, unsetSecretKey } from "@/utils/localStorage";

import { adminLinks } from "@/data/navigation";

/**
 * Customer area page component
 */
const CustomerArea: React.FC = () => {
  useSecretKey();

  const isAdmin = useSelector(getIsAdmin);
  const date = useSelector(getCalendarDay);
  const slotsByDay = useSelector(getSlotsForCustomer);

  const bookedSlotsByMonth = useSelector(getBookedSlotsByMonth(date.month));

  // Subscribe to necessary collections
  useFirestoreSubscribe([
    OrgSubCollection.SlotsByDay,
    OrgSubCollection.Bookings,
    Collection.PublicOrgInfo,
    BookingSubCollection.BookedSlots,
    BookingSubCollection.Calendar,
  ]);

  const calendarNavProps = useDate();

  // Get customer data necessary for rendering/functoinality
  const { name, surname, photoURL } = useSelector(getBookingsCustomer) || {};
  const displayCustomer = {
    displayName: [name, surname].filter((n) => Boolean(n)).join(" ") || "",
    photoURL,
  };

  // Get appropriate view to render
  const views = {
    BookView,
    CalendarView,
  };
  const [view, setView] = useState<keyof typeof views>("BookView");

  const additionalButtons = (
    <>
      <TabItem
        key="book-view-button"
        Icon={Calendar as any}
        label="Book"
        onClick={() => setView("BookView")}
        active={view === "BookView"}
      />
      <TabItem
        key="calendar-view-button"
        Icon={AccountCircle as any}
        label="Calendar"
        onClick={() => setView("CalendarView")}
        active={view === "CalendarView"}
      />
    </>
  );

  const addToCalendar = Object.keys(bookedSlotsByMonth).length ? (
    <AddToCalendar bookedSlots={bookedSlotsByMonth} slots={slotsByDay} />
  ) : (
    <></>
  );

  const CustomerView = views[view];

  return (
    <Layout
      isAdmin={isAdmin}
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalButtons={additionalButtons}
      user={displayCustomer}
    >
      <CalendarNav
        {...calendarNavProps}
        additionalContent={addToCalendar}
        jump="month"
      />
      <div className="content-container">
        <div className="px-[44px] py-4">
          <CustomerView />
        </div>
      </div>
    </Layout>
  );
};

/**
 * Secret key logic abstracted away in a hook for easier readability
 */
const useSecretKey = () => {
  // Secret key is provided as a route param to the customer_area page
  const { secretKey } = useParams<{
    secretKey: string;
  }>();

  /**
   * @TODO this disables the user (admin)
   * from looking at bookings for multiple
   * customers in different tabs and we should find
   * a way around it (probably store the key in store)
   */
  // Store secretKey to localStorage
  // for easier access
  useEffect(() => {
    setSecretKey(secretKey);

    return () => {
      // remove secretKey from local storage on unmount
      unsetSecretKey();
    };
  }, [secretKey]);

  return secretKey;
};

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

export default CustomerArea;
