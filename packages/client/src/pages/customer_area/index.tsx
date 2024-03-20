import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Redirect } from "react-router-dom";
import i18n, { CustomerNavigationLabel } from "@eisbuk/translations";

import { CalendarNav, DateDebug, LayoutContent, TabItem } from "@eisbuk/ui";
import { Calendar, AccountCircle, ClipboardList } from "@eisbuk/svg";
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
} from "@eisbuk/shared";
import { Routes } from "@eisbuk/shared/ui";
import {
  useFirestoreSubscribe,
  useUpdateSubscription,
} from "@eisbuk/react-redux-firebase-firestore";

import { getOrganization } from "@/lib/getters";

import BookView from "./views/Book";
import CalendarView from "./views/Calendar";
import ProfileView from "./views/Profile";

import { useDate } from "./hooks";
import useSecretKey from "@/hooks/useSecretKey";

import Layout from "@/controllers/Layout";
import PrivacyPolicyToast from "@/controllers/PrivacyPolicyToast";
import AthleteAvatar from "@/controllers/AthleteAvatar";

import ErrorBoundary from "@/components/atoms/ErrorBoundary";

import {
  getBookingsCustomer,
  getOtherBookingsAccounts,
} from "@/store/selectors/bookings";
import { getAllSecretKeys, getIsAdmin } from "@/store/selectors/auth";
import { getSystemDate } from "@/store/selectors/app";

import { resetSystemDate, setSystemDate } from "@/store/actions/appActions";

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
  const dispatch = useDispatch();

  const secretKey = useSecretKey();
  const isAdmin = useSelector(getIsAdmin);

  const { value: systemDate } = useSelector(getSystemDate);

  // Reset the system date on unmount, as it could have only been used (if it had been used at all) for debugging of
  // the current page
  useEffect(() => {
    return () => {
      dispatch(resetSystemDate());
    };
  }, []);

  // We're providing a fallback [secretKey] as we have multiple ways of authenticating. If authenticating
  // using firebase auth, the user will have all of their secret keys in the store (this is the preferred way).
  // However, user can simply use a booking link (which includes the secret key). For this method, the user doesn't have
  // to authenticate with firebase auth, no secret keys will be found in auth section of the store and 'getAllSecretKeys' selector
  // will return 'undefined'
  const secretKeysInStore = useSelector(getAllSecretKeys);
  const secretKeys = secretKeysInStore?.length
    ? secretKeysInStore
    : [secretKey];

  // Subscribe to necessary collections
  useFirestoreSubscribe(getOrganization(), [
    { collection: OrgSubCollection.SlotsByDay },
    { collection: OrgSubCollection.SlotBookingsCounts },
    { collection: Collection.PublicOrgInfo },
    {
      collection: OrgSubCollection.Bookings,
      meta: { secretKeys },
    },
    { collection: BookingSubCollection.BookedSlots, meta: { secretKey } },
    { collection: BookingSubCollection.AttendedSlots, meta: { secretKey } },
    { collection: BookingSubCollection.Calendar, meta: { secretKey } },
  ]);

  useUpdateSubscription(
    { collection: OrgSubCollection.Bookings, meta: { secretKeys } },
    [secretKeys]
  );
  useUpdateSubscription(
    { collection: BookingSubCollection.BookedSlots, meta: { secretKey } },
    [secretKey]
  );
  useUpdateSubscription(
    { collection: BookingSubCollection.AttendedSlots, meta: { secretKey } },
    [secretKey]
  );

  const calendarNavProps = useDate();

  // Get customer data necessary for rendering/functionality
  const currentAthlete = useSelector(getBookingsCustomer(secretKey)) || {};
  const otherAccounts = useSelector(getOtherBookingsAccounts(secretKey));

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

  if (secretKey && currentAthlete.deleted) {
    return <Redirect to={`${Routes.Deleted}/${secretKey}`} />;
  }

  return (
    <Layout
      additionalButtons={additionalButtons}
      userAvatar={
        <AthleteAvatar
          currentAthlete={currentAthlete}
          otherAccounts={otherAccounts}
        />
      }
    >
      {view !== "ProfileView" && (
        <CalendarNav
          {...calendarNavProps}
          // TODO: Reinstate this when the ability to add multiple events is fixed
          // See: https://github.com/eisbuk/EisBuk/issues/827
          //
          // additionalContent={<AddToCalendar />}
          jump="month"
          additionalContent={
            isAdmin ? (
              <DateDebug
                value={systemDate}
                onChange={(date) => dispatch(setSystemDate(date))}
              />
            ) : undefined
          }
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
