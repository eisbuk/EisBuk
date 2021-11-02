import React, { useMemo } from "react";
import { Route, Switch, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { isEmpty, isLoaded } from "react-redux-firebase";

import { CustomerRoute, Routes } from "@/enums/routes";

import CustomerSlots from "./CustomerSlots";
import BookingsCalendar from "./BookingsCalendar";
import CustomerNavigation from "./CustomerNavigation";
import AppbarCustomer from "@/components/layout/AppbarCustomer";
import AppbarAdmin from "@/components/layout/AppbarAdmin";

import useCustomerBookings from "@/hooks/useCustomerBookings";

import {
  getBookingsCustomer,
  getBookedSlots,
} from "@/store/selectors/bookings";
import { getSlotsForCustomer } from "@/store/selectors/slots";
import { getFirebaseAuth } from "@/store/selectors/auth";
import { getCalendarDay } from "@/store/selectors/app";

import { splitSlotsByCustomerRoute } from "./utils";

/**
 * Customer sub routes:
 * - renders the apropriate `customerRoute` within `CustomersPage` and `CustomerNavigation`
 * - catches all `/customers/:secretKey/<customerRoute>` routes
 * - initializes `useFirestoreConnect` with appropriate params
 * - gets all slots and bookings from store (for appropriate timeframe)
 *   and processes to prepare `slots`/`subscribedSlots`/`bookings` props for each respective sub route
 * - renders appropriate sub route with respect to `customerRoute` provided
 */
const CustomerArea: React.FC = () => {
  const { customerRoute, secretKey } = useParams<{
    secretKey: string;
    customerRoute: CustomerRoute;
  }>();

  useCustomerBookings(secretKey);

  const customerData = useSelector(getBookingsCustomer);
  const date = useSelector(getCalendarDay);

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
          path={`${Routes.CustomerArea}/:secretKey/${CustomerRoute.BookIce}`}
        >
          <CustomerSlots
            view={CustomerRoute.BookIce}
            slots={bookIceSlots}
            {...{ bookedSlots }}
          />
        </Route>
        <Route
          path={`${Routes.CustomerArea}/:secretKey/${CustomerRoute.BookOffIce}`}
        >
          <CustomerSlots
            view={CustomerRoute.BookOffIce}
            slots={bookOffIceSlots}
            {...{ bookedSlots }}
          />
        </Route>
        <Route
          path={`${Routes.CustomerArea}/:secretKey/${CustomerRoute.Calendar}`}
        >
          <BookingsCalendar slots={calendarSlots} {...{ bookedSlots }} />
        </Route>
      </Switch>
    </>
  );
};

export default CustomerArea;
