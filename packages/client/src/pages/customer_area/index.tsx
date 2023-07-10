import React, { useState } from "react";
import { useSelector } from "react-redux";
import i18n, { CustomerNavigationLabel } from "@eisbuk/translations";

import { CalendarNav, Layout, TabItem } from "@eisbuk/ui";
import { Calendar, AccountCircle, ClipboardList } from "@eisbuk/svg";
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";
import { useFirestoreSubscribe } from "@eisbuk/react-redux-firebase-firestore";

import { getOrganization } from "@/lib/getters";

import BookView from "./views/Book";
import CalendarView from "./views/Calendar";
import ProfileView from "./views/Profile";
import { useSecretKey, useDate } from "./hooks";

import { NotificationsContainer } from "@/features/notifications/components";
import AddToCalendar from "@/components/atoms/AddToCalendar";

import BirthdayMenu from "@/controllers/BirthdayMenu";
import AthletesApproval from "@/controllers/AthletesApproval";

import { getBookingsCustomer } from "@/store/selectors/bookings";
import { getIsAdmin } from "@/store/selectors/auth";

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
  const secretKey = useSecretKey();

  const isAdmin = useSelector(getIsAdmin);

  const additionalAdminContent = (
    <React.Fragment>
      <BirthdayMenu />
      <AthletesApproval />
    </React.Fragment>
  );
  // Subscribe to necessary collections
  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.SlotsByDay },
    { collection: Collection.PublicOrgInfo },
    { collection: OrgSubCollection.Bookings, meta: { secretKey } },
    { collection: BookingSubCollection.BookedSlots, meta: { secretKey } },
    { collection: BookingSubCollection.AttendedSlots, meta: { secretKey } },
    { collection: BookingSubCollection.Calendar, meta: { secretKey } },
  ]);

  const calendarNavProps = useDate();

  // Get customer data necessary for rendering/functoinality
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

  return (
    <Layout
      isAdmin={isAdmin}
      adminLinks={adminLinks}
      Notifications={NotificationsContainer}
      additionalButtons={additionalButtons}
      additionalAdminContent={additionalAdminContent}
      user={userData}
    >
      {view !== "ProfileView" && (
        <CalendarNav
          {...calendarNavProps}
          additionalContent={<AddToCalendar />}
          jump="month"
        />
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
