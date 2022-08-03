import React, { useState } from "react";

import { useSelector } from "react-redux";

import { CalendarNav, Layout, TabItem } from "@eisbuk/ui";
import { Calendar, AccountCircle, ClipboardList } from "@eisbuk/svg";
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";

import BookView from "./views/Book";
import CalendarView from "./views/Calendar";
import ProfileView from "./views/Profile";
import { useSecretKey, useDate } from "./hooks";

import { NotificationsContainer } from "@/features/notifications/components";

import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";
import { getBookingsCustomer } from "@/store/selectors/bookings";

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

  const [view, setView] = useState<keyof typeof viewsLookup>(Views.Book);
  const CustomerView = viewsLookup[view];

  const additionalButtons = (
    <>
      <TabItem
        key="book-view-button"
        Icon={Calendar as any}
        label="Book"
        onClick={() => setView(Views.Book)}
        active={view === Views.Book}
      />
      <TabItem
        key="calendar-view-button"
        Icon={AccountCircle as any}
        label="Calendar"
        onClick={() => setView(Views.Calendar)}
        active={view === Views.Calendar}
      />
      <TabItem
        key="profile-view-button"
        Icon={ClipboardList as any}
        label="Profile"
        onClick={() => setView(Views.Profile)}
        active={view === Views.Profile}
      />
    </>
  );

  return (
    <Layout
      Notifications={NotificationsContainer}
      additionalButtons={additionalButtons}
      user={customerData}
    >
      {view !== "ProfileView" && (
        <CalendarNav {...calendarNavProps} jump="month" />
      )}
      <div className="content-container">
        <div className="px-[44px] py-4">
          <CustomerView />
        </div>
      </div>
    </Layout>
  );
};

export default CustomerArea;

enum Views {
  Book = "BookView",
  Calendar = "CalendarView",
  Profile = "ProfileView",
}

// Get appropriate view to render
const viewsLookup = {
  [Views.Book]: BookView,
  [Views.Calendar]: CalendarView,
  [Views.Profile]: ProfileView,
};
