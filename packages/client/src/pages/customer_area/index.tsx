import React, { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { CalendarNav, Layout, TabItem } from "@eisbuk/ui";
import { Calendar, AccountCircle } from "@eisbuk/svg";
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";

import BookView from "./views/Book";
import CalendarView from "./views/Calendar";
import { NotificationsContainer } from "@/features/notifications/components";

import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";
import { getBookingsCustomer } from "@/store/selectors/bookings";
import { getCalendarDay } from "@/store/selectors/app";
import { changeCalendarDate } from "@/store/actions/appActions";

import { setSecretKey, unsetSecretKey } from "@/utils/localStorage";

/**
 * Customer area page component
 */
const CustomerArea: React.FC = () => {
  useSecretKey();

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
  const customerData = useSelector(getBookingsCustomer);

  // Get appropriate view to render
  const views = {
    BookView,
    CalendarView,
  };
  const [view, setView] = useState<keyof typeof views>("BookView");
  const additionalButtons = (
    <>
      <TabItem
        Icon={Calendar as any}
        label="Book"
        onClick={() => setView("BookView")}
        active={view === "BookView"}
      />
      <TabItem
        Icon={AccountCircle as any}
        label="Calendar"
        onClick={() => setView("CalendarView")}
        active={view === "CalendarView"}
      />
    </>
  );
  const CustomerView = views[view];

  return (
    <Layout
      Notifications={NotificationsContainer}
      additionalButtons={additionalButtons}
      user={customerData}
    >
      <CalendarNav {...calendarNavProps} jump="month" />
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
const useDate = (): Pick<
  Parameters<typeof CalendarNav>[0],
  "date" | "onChange"
> => {
  const dispatch = useDispatch();

  const date = useSelector(getCalendarDay);
  const onChange = (date: DateTime) => dispatch(changeCalendarDate(date));

  return { date, onChange };
};

export default CustomerArea;
