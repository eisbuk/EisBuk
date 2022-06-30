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

/**
 * Customer area page component
 */
const CustomerArea: React.FC = () => {
  const dispatch = useDispatch();

  // Subscribe to necessary collections
  useFirestoreSubscribe([
    OrgSubCollection.SlotsByDay,
    OrgSubCollection.Bookings,
    Collection.PublicOrgInfo,
    BookingSubCollection.BookedSlots,
    BookingSubCollection.Calendar,
  ]);

  // Get secret key and store it to localStorage
  // for easier access
  const { secretKey } = useParams<{
    secretKey: string;
  }>();
  useEffect(() => {
    setSecretKey(secretKey);

    return () => {
      // remove secretKey from local storage on unmount
      unsetSecretKey();
    };
  }, [secretKey]);

  // CalendarNav controlls
  const date = useSelector(getCalendarDay);
  const changeDate = (date: DateTime) => dispatch(changeCalendarDate(date));

  // Get customer data necessary for rendering/functoinality
  const customerData = useSelector(getBookingsCustomer);

  const slotsTimeframe = "month";
  const slotsSelector = customerData
    ? getSlotsForCustomer(
        customerData.category,
        slotsTimeframe,
        date.startOf("month")
      )
    : () => undefined;
  const daysToRender = useSelector(slotsSelector);

  const additionalButtons = (
    <>
      <TabItem Icon={Calendar as any} label="Book" />
      <TabItem Icon={AccountCircle as any} label="Calendar" />
    </>
  );

  return (
    <Layout additionalButtons={additionalButtons} user={customerData}>
      <CalendarNav date={date} onChange={changeDate} jump="month" />
      <div className="content-container">
        <div className="px-[44px]">
          {daysToRender && renderDays(daysToRender)}
        </div>
      </div>
    </Layout>
  );
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
