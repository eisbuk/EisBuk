import React, { useEffect } from "react";
import { DateTime } from "luxon";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  CalendarNav,
  IntervalCardGroup,
  Layout,
  SlotsDayContainer,
  TabItem,
} from "@eisbuk/ui";
import { Calendar, AccountCircle } from "@eisbuk/svg";
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
  SlotsByDay,
  SlotsById,
} from "@eisbuk/shared";

import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";
import { getBookingsCustomer } from "@/store/selectors/bookings";
import { getSlotsForCustomer } from "@/store/selectors/slots";
import { getCalendarDay } from "@/store/selectors/app";
import { changeCalendarDate } from "@/store/actions/appActions";

import { setSecretKey, unsetSecretKey } from "@/utils/localStorage";
import BookingsCountdownContainer from "@/controllers/BookingsCountdown";

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

  const slotsSelector = customerData ? getSlotsForCustomer : () => undefined;
  const daysToRender = useSelector(slotsSelector);

  const additionalButtons = (
    <>
      <TabItem Icon={Calendar as any} label="Book" />
      <TabItem Icon={AccountCircle as any} label="Calendar" />
    </>
  );

  return (
    <Layout additionalButtons={additionalButtons} user={customerData}>
      <CalendarNav {...calendarNavProps} jump="month" />
      <div className="content-container">
        <div className="px-[44px] py-4">
          <BookingsCountdownContainer />
          {daysToRender && renderDays(daysToRender)}
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

const renderDays = (days: SlotsByDay) =>
  Object.keys(days).map((date) => (
    <SlotsDayContainer date={DateTime.fromISO(date)}>
      {renderSlots(days[date])}
    </SlotsDayContainer>
  ));

const renderSlots = (slots: SlotsById): JSX.Element[] =>
  Object.values(slots).map((slot) => (
    <IntervalCardGroup key={slot.id} {...slot} />
  ));

export default CustomerArea;
