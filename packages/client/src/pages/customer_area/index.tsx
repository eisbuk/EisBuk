import React, { useState } from "react";
import { DateTime } from "luxon";
import { useSelector } from "react-redux";

import { CalendarNav, Layout, TabItem } from "@eisbuk/ui";
import { Calendar, AccountCircle, ClipboardList } from "@eisbuk/svg";
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import BookView from "./views/Book";
import CalendarView from "./views/Calendar";
import ProfileView from "./views/Profile";
import { useSecretKey, useDate } from "./hooks";

import { NotificationsContainer } from "@/features/notifications/components";

import BirthdayMenu from "@/components/atoms/BirthdayMenu";

import { getBookingsCustomer } from "@/store/selectors/bookings";
import { getIsAdmin } from "@/store/selectors/auth";
import { getCustomersByBirthday } from "@/store/selectors/customers";

import { adminLinks } from "@/data/navigation";

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

/**
 * Customer area page component
 */
const CustomerArea: React.FC = () => {
  useSecretKey();

  const isAdmin = useSelector(getIsAdmin);

  const customersByBirthday = useSelector(
    getCustomersByBirthday(DateTime.now())
  );

  const additionalAdminContent = (
    <BirthdayMenu customers={customersByBirthday} />
  );

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
      isAdmin={isAdmin}
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalButtons={additionalButtons}
      additionalAdminContent={additionalAdminContent}
      user={displayCustomer}
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
