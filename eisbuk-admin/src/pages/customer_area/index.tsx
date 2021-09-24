import React, { useMemo } from "react";
import { Route, Switch, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { isEmpty, isLoaded, useFirestoreConnect } from "react-redux-firebase";
import { DateTime } from "luxon";

import { OrgSubCollection } from "eisbuk-shared";

import { CustomerRoute, Routes } from "@/enums/routes";

import CustomerSlots from "./CustomerSlots";
import BookingsCalendar from "./BookingsCalendar";
import CustomerNavigation from "./CustomerNavigation";
import AppbarCustomer from "@/components/layout/AppbarCustomer";
import AppbarAdmin from "@/components/layout/AppbarAdmin";

import useConnectSlotsAndBookgins from "./hooks/useConnectSlotsAndBookings";

import { getBookingsCustomer } from "@/store/selectors/bookings";
import { getSlotsForCustomer, getBookedSlots } from "@/store/selectors/slots";
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
const CustomerArea: React.FC = () => {
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
  const bookedSlots = useSelector(getBookedSlots);

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
          path={`${Routes.CustomerArea}/:secretKey/${CustomerRoute.BookIce}/:date?`}
        >
          <CustomerSlots
            view={CustomerRoute.BookIce}
            slots={bookIceSlots}
            {...{ bookedSlots }}
          />
        </Route>
        <Route
          path={`${Routes.CustomerArea}/:secretKey/${CustomerRoute.BookOffIce}/:date?`}
        >
          <CustomerSlots
            view={CustomerRoute.BookOffIce}
            slots={bookOffIceSlots}
            {...{ bookedSlots }}
          />
        </Route>
        <Route
          path={`${Routes.CustomerArea}/:secretKey/${CustomerRoute.Calendar}/:date?`}
        >
          <BookingsCalendar slots={calendarSlots} {...{ bookedSlots }} />
        </Route>
      </Switch>
    </>
  );
};

export default CustomerArea;
