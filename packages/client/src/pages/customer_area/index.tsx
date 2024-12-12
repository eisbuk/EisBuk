import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Redirect } from "react-router-dom";
import i18n, {
  CustomerNavigationLabel,
  Debug,
  useTranslation,
} from "@eisbuk/translations";

import {
  Button,
  ButtonColor,
  CalendarNav,
  LayoutContent,
  TabItem,
} from "@eisbuk/ui";
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

import AdminBar from "@/controllers/AdminBar";
import { NotificationsContainer } from "@/features/notifications/components";
import PrivacyPolicyToast from "@/controllers/PrivacyPolicyToast";
import AthleteAvatar from "@/controllers/AthleteAvatar";

import ErrorBoundary from "@/components/atoms/ErrorBoundary";

import {
  getBookingsCustomer,
  getOtherBookingsAccounts,
} from "@/store/selectors/bookings";
import { getAllSecretKeys, getIsAdmin } from "@/store/selectors/auth";

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

  const { t } = useTranslation();

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

  const [debugOn, setDebugOn] = useState(false);
  const toggleDebug = () => setDebugOn(!debugOn);

  const additionalButtons = (
    <>
      <TabItem
        key="book-view-button"
        Icon={Calendar as any}
        label={t(CustomerNavigationLabel.Book)}
        onClick={() => setView(Views.Book)}
        active={view === Views.Book}
      />
      <TabItem
        key="calendar-view-button"
        Icon={AccountCircle as any}
        label={t(CustomerNavigationLabel.Calendar)}
        onClick={() => setView(Views.Calendar)}
        active={view === Views.Calendar}
      />
      <TabItem
        key="profile-view-button"
        Icon={ClipboardList as any}
        label={t(CustomerNavigationLabel.Profile)}
        onClick={() => setView(Views.Profile)}
        active={view === Views.Profile}
      />
    </>
  );

  const additionalButtonsSM = (
    <>
      <button
        key="book-view-button"
        onClick={() => setView(Views.Book)}
        className={`w-24 rounded-2xl px-2 py-0.5 border overflow-hidden ${
          view === Views.Book
            ? "bg-cyan-700 text-white"
            : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"
        }`}
      >
        {i18n.t(CustomerNavigationLabel.Book)}
      </button>
      <button
        key="calendar-view-button"
        onClick={() => setView(Views.Calendar)}
        className={`w-24 rounded-2xl px-2 py-0.5 border overflow-hidden ${
          view === Views.Calendar
            ? "bg-cyan-700 text-white"
            : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"
        }`}
      >
        {i18n.t(CustomerNavigationLabel.Calendar)}
      </button>
      <button
        key="profile-view-button"
        onClick={() => setView(Views.Profile)}
        className={`w-24 rounded-2xl px-2 py-0.5 border overflow-hidden ${
          view === Views.Profile
            ? "bg-cyan-700 text-white"
            : "bg-white text-gray-700 hover:text-white hover:bg-gray-700"
        }`}
      >
        {i18n.t(CustomerNavigationLabel.Profile)}
      </button>
    </>
  );

  if (secretKey && currentAthlete.deleted) {
    return <Redirect to={`${Routes.Deleted}/${secretKey}`} />;
  }

  return (
    <div
      className={`absolute top-0 right-0 left-0 flex flex-col ${
        isAdmin ? "pt-[210px] md:pt-[272px]" : "pt-[140px] md:pt-[202px]"
      }`}
    >
      <header className="fixed left-0 top-0 right-0 bg-gray-800 z-50">
        <div className="content-container">
          {isAdmin && (
            <AdminBar className="flex w-full h-[70px] py-[15px] justify-between items-center print:hidden" />
          )}

          <div className="flex w-full h-[70px] py-[15px] justify-between items-center print:hidden">
            <div>{null}</div>
            <AthleteAvatar
              currentAthlete={currentAthlete}
              otherAccounts={otherAccounts}
            />
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

      <div
        className={`fixed left-0 ${
          isAdmin ? "top-[142px]" : "top-[72px]"
        } right-0 border-b border-gray-400 z-40 md:border-none ${
          isAdmin ? "md:top-[212px]" : "md:top-[142px]"
        }`}
      >
        {view === "ProfileView" ? (
          <div className="h-[68px] bg-ice-300 md:h-[60px]" />
        ) : (
          <CalendarNav
            {...calendarNavProps}
            // TODO: Reinstate this when the ability to add multiple events is fixed
            // See: https://github.com/eisbuk/EisBuk/issues/827
            //
            // additionalContent={<AddToCalendar />}
            jump="month"
            additionalContent={
              isAdmin && view === "BookView" ? (
                <Button
                  onClick={toggleDebug}
                  color={debugOn ? ButtonColor.Primary : undefined}
                  className={[
                    "h-12 hidden md:flex md:h-auto",
                    !debugOn
                      ? "!text-black outline outline-gray-300 border-box"
                      : "",
                  ].join(" ")}
                >
                  {t(Debug.DebugButtonLabel)}
                </Button>
              ) : undefined
            }
          />
        )}

        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 flex items-center gap-2 md:hidden">
          {additionalButtonsSM}
        </div>
      </div>

      <LayoutContent>
        <ErrorBoundary resetKeys={[calendarNavProps]}>
          <CustomerView debugOn={debugOn} setDebugOn={setDebugOn} />
        </ErrorBoundary>
      </LayoutContent>

      <div
        className={`fixed px-4 ${
          view === Views.Book && isAdmin ? "bottom-[70px]" : "bottom-4"
        } right-0 z-40 md:hidden`}
      >
        <NotificationsContainer />
      </div>

      <div className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 content-container text-center">
        <PrivacyPolicyToast />
      </div>
    </div>
  );
};

export default CustomerArea;
