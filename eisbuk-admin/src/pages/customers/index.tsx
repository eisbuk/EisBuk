import React, { useMemo } from "react";
import { Route, Switch, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { isEmpty, isLoaded, useFirestoreConnect } from "react-redux-firebase";
import { DateTime } from "luxon";

import { Duration, OrgSubCollection } from "eisbuk-shared";

import { CustomerRoute, PrivateRoutes } from "@/enums/routes";

import CustomerSlots from "./CustomerSlots";
import BookingsCalendar from "./BookingsCalendar";
import CustomerNavigation from "./CustomerNavigation";
import AppbarCustomer from "@/components/layout/AppbarCustomer";
import AppbarAdmin from "@/components/layout/AppbarAdmin";
import { BookingCardProps } from "@/components/atoms/BookingCard";

import useConnectSlotsAndBookgins from "./hooks/useConnectSlotsAndBookings";

import { getBookingsCustomer } from "@/store/selectors/bookings";
import {
  getSlotsForCustomer,
  getSubscribedSlots,
} from "@/store/selectors/slots";
import { getFirebaseAuth } from "@/store/selectors/auth";

import { splitSlotsByCustomerRoute } from "./utils";
import { wrapOrganization } from "@/utils/firestore";

/**
 * Customer sub routes:
 * - renders the apropriate `customerRoute` within `CustomersPage` and `CustomerNavigation`
 * - catches all `/customers/:secretKey/book_ice/:date` routes
 * - initializes `useFirestoreConnect` with appropriate params (handled through `useConnectSlotsAndBookings` hook)
 * - gets all slots from store (for appropriate timeframe)
 *   and processes to prepare `slots`/`subscribedSlots`/`bookings` props for each respective sub route
 * - renders appropriate sub route with respect to `customerRoute` provided
 * @returns
 */
const CustomerPage: React.FC = () => {
  const { customerRoute, date: isoDate, secretKey } = useParams<{
    secretKey: string;
    date: string | undefined;
    customerRoute: CustomerRoute;
  }>();

  // connect slots and bookings in firebase and local store
  useFirestoreConnect([
    wrapOrganization({
      collection: OrgSubCollection.Bookings,
      doc: secretKey,
    }),
  ]);
  useConnectSlotsAndBookgins();

  /** @TODO fix this selector to return singluar customer data */
  const [customerData] = useSelector(getBookingsCustomer) || [];

  // process date for easier handling
  const date = isoDate ? DateTime.fromISO(isoDate) : undefined;

  // only the "book_ice" will use "month" timeframe, the rest will use "week"
  const timeframe = customerRoute === CustomerRoute.BookIce ? "month" : "week";

  // get slots from store for apropriate timespan
  const slotsSelector = useMemo(
    () =>
      customerData && date
        ? getSlotsForCustomer(customerData.category, timeframe, date)
        : () => ({}),
    [date, customerData, timeframe]
  );

  // get raw slots (slots by day) from store
  const rawSlots = useSelector(slotsSelector);

  // process slots for each route
  const {
    [CustomerRoute.BookIce]: bookIceSlots,
    [CustomerRoute.BookOffIce]: bookOffIceSlots,
    [CustomerRoute.Calendar]: calendarSlots,
  } = splitSlotsByCustomerRoute(rawSlots);

  // create bookings to display
  const subscribedSlots = useSelector(getSubscribedSlots);

  /**
   * Extract:
   * - `bookings` (used for `BookingsCalendar`)
   * - `bookedSlots` (used for `CustomerSlots`)
   * We're taking these values as a tuple to reduce the processing time (and amount of code)
   * by utilizing the same iteration for both structures
   * (as they're using the same data, only structured a bit differently)
   */
  const [bookings, bookedSlots] = Object.values(subscribedSlots).reduce(
    (acc, bookingInfo) => {
      const { id, duration: bookedDuration } = bookingInfo;

      // apply filter mask to subscribedSlots (recieved from store)
      // against calendarSlots (processed from raw slots)
      return calendarSlots[id]
        ? [
            // update `bookings` structure
            [...acc[0], { ...calendarSlots[id], bookedDuration }],
            // update `bookedSlots` structure
            { ...acc[1], [id]: bookedDuration },
          ]
        : // if slot data for subscribedSlot not found omit that slot altogether
          acc;
    },
    [[], {}] as [
      Array<BookingCardProps & { id: string }>,
      Record<string, Duration>
    ]
  );

  /**
   * @TODO This is copy pasted from old `CustomerAreaPage`.
   * We might want to find a simpler way to handle this (admin status)
   */
  const auth = useSelector(getFirebaseAuth);

  const title =
    isLoaded(customerData) && customerData
      ? `${customerData.name} ${customerData.surname}`
      : "";

  const headers = (
    <>
      {isLoaded(auth) && !isEmpty(auth) && <AppbarAdmin />}
      <AppbarCustomer headingText={title} />
    </>
  );

  return (
    <>
      {headers}
      <CustomerNavigation />
      <Switch>
        <Route
          path={`${PrivateRoutes.Customers}/:secretKey/${CustomerRoute.BookIce}/:date?`}
        >
          <CustomerSlots
            view={CustomerRoute.BookIce}
            slots={bookIceSlots}
            subscribedSlots={bookedSlots}
          />
        </Route>
        <Route
          path={`${PrivateRoutes.Customers}/:secretKey/${CustomerRoute.BookOffIce}/:date?`}
        >
          <CustomerSlots
            view={CustomerRoute.BookOffIce}
            slots={bookOffIceSlots}
            subscribedSlots={bookedSlots}
          />
        </Route>
        <Route
          path={`${PrivateRoutes.Customers}/:secretKey/${CustomerRoute.Calendar}/:date?`}
        >
          <BookingsCalendar bookings={bookings} />
        </Route>
      </Switch>
    </>
  );
};

// /**
//  * A wrapper component around the page. We're using this to:
//  * - serve as a component for route catching all paths starting with `/customers/:secretKey`
//  * - connect local store with apropriate `bookings` data for customer (determined by `secretKey` route param)
//  * - render customer navigation: autamatically appending `customerRoute` to the path if not already provided (default `/customers/:secretKey/book_ice`)
//  * - render sub routes catching all paths starting with `/customers/:secretKey/:customerRoute`
//  * @returns
//  */
// const CustomerPage: React.FC = () => {
//   const { secretKey } = useParams<{
//     secretKey: string;
//   }>();

//   useFirestoreConnect([
//     wrapOrganization({
//       collection: OrgSubCollection.Bookings,
//       doc: secretKey,
//     }),
//   ]);

//   /** @TODO fix this selector to return singluar customer data */
//   const [customerData] = useSelector(getBookingsCustomer) || [];

//   /**
//    * @TODO This is copy pasted from old `CustomerAreaPage`.
//    * We might want to find a simpler way to handle this (admin status)
//    */
//   const auth = useSelector(getFirebaseAuth);

//   const title =
//     isLoaded(customerData) && customerData
//       ? `${customerData.name} ${customerData.surname}`
//       : "";

//   const headers = (
//     <>
//       {isLoaded(auth) && !isEmpty(auth) && <AppbarAdmin />}
//       <AppbarCustomer headingText={title} />
//     </>
//   );
//   return (
//     <>
//       {headers}
//       <CustomerNavigation />
//       <Route
//         path={`${PrivateRoutes.Customers}/:secretKey/:customerRoute/:date?`}
//         component={CustomerRoutes}
//       />
//     </>
//   );
// };

export default CustomerPage;
