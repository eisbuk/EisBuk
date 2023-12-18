import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Redirect } from "react-router-dom";
import i18n, { CustomerNavigationLabel } from "@eisbuk/translations";

import { CalendarNav, LayoutContent, TabItem } from "@eisbuk/ui";
import { Calendar, AccountCircle, ClipboardList } from "@eisbuk/svg";
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";
import { Routes } from "@eisbuk/shared/ui";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { getOrganization } from "@/lib/getters";

import BookView from "./views/Book";
import CalendarView from "./views/Calendar";
import ProfileView from "./views/Profile";
import { useSecretKey, useDate } from "./hooks";
import PrivacyPolicyToast from "@/controllers/PrivacyPolicyToast";

import ErrorBoundary from "@/components/atoms/ErrorBoundary";

import Layout from "@/controllers/Layout";

import { getBookingsCustomer } from "@/store/selectors/bookings";

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
  const secretKey = useSecretKey();

  // Subscribe to necessary collections
  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.SlotsByDay },
    { collection: OrgSubCollection.SlotBookingsCounts },
    { collection: Collection.PublicOrgInfo },
    { collection: OrgSubCollection.Bookings, meta: { secretKey } },
    { collection: BookingSubCollection.BookedSlots, meta: { secretKey } },
    { collection: BookingSubCollection.AttendedSlots, meta: { secretKey } },
    { collection: BookingSubCollection.Calendar, meta: { secretKey } },
  ]);

  const calendarNavProps = useDate();

  // Get customer data necessary for rendering/functionality
  const userData = useSelector(getBookingsCustomer) || {};

  const [view, setView] = useState<keyof typeof viewsLookup>(Views.Book);
  const CustomerView = viewsLookup[view];

  const additionalButtons = (
    <>
      <TabItem
        key="book-view-button"
        Icon={Calendar as any}
        label={i18n.t(CustomerNavigationLabel.Book)}
        onClick={() => setView(Views.Book)}
        active={view === Views.Book}
      />
      <TabItem
        key="calendar-view-button"
        Icon={AccountCircle as any}
        label={i18n.t(CustomerNavigationLabel.Calendar)}
        onClick={() => setView(Views.Calendar)}
        active={view === Views.Calendar}
      />
      <TabItem
        key="profile-view-button"
        Icon={ClipboardList as any}
        label={i18n.t(CustomerNavigationLabel.Profile)}
        onClick={() => setView(Views.Profile)}
        active={view === Views.Profile}
      />
    </>
  );

  if (secretKey && userData.deleted) {
    return <Redirect to={Routes.Deleted} />;
  }

  return (
    <Layout additionalButtons={additionalButtons} user={userData}>
      {view !== "ProfileView" && (
        <CalendarNav
          {...calendarNavProps}
          // TODO: Reinstate this when the ability to add multiple events is fixed
          // See: https://github.com/eisbuk/EisBuk/issues/827
          //
          // additionalContent={<AddToCalendar />}
          jump="month"
        />
      )}
      <LayoutContent>
        <ErrorBoundary resetKeys={[calendarNavProps]}>
          <div className="px-[44px] py-4">
            <CustomerView />
          </div>
        </ErrorBoundary>
      </LayoutContent>

      <div className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 content-container text-center">
        <PrivacyPolicyToast />
      </div>
    </Layout>
  );
};

export default CustomerArea;
