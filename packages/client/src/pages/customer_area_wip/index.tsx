import React, { useEffect } from "react";
import { DateTime } from "luxon";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  CalendarNav,
  IntervalCardGroup,
  Layout,
  SlotsDayContainer,
  TabItem,
} from "@eisbuk/ui";
import { Calendar, AccountCircle } from "@eisbuk/svg";

import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";
import { getBookingsCustomer } from "@/store/selectors/bookings";

import { setSecretKey, unsetSecretKey } from "@/utils/localStorage";

// #region temporaryTestData
import {
  BookingSubCollection,
  Collection,
  OrgSubCollection,
  SlotType,
} from "@eisbuk/shared";

import { baseSlot } from "@/__testData__/slots";

const testDate = DateTime.fromISO("2022-01-01");

const daysToRender = Array(7)
  .fill(null)
  .map((_, i) => testDate.plus({ days: i }));

const slotsToRender = [baseSlot, { ...baseSlot, type: SlotType.OffIce }];
// #region temporaryTestData

/**
 * Customer area page component
 */
const CustomerArea: React.FC = () => {
  const { secretKey } = useParams<{
    secretKey: string;
  }>();

  // store secret key to local storage
  // for easier access
  useEffect(() => {
    setSecretKey(secretKey);

    return () => {
      // remove secretKey from local storage on unmount
      unsetSecretKey();
    };
  }, [secretKey]);

  // Subscribe to necessary collections
  useFirestoreSubscribe([
    OrgSubCollection.SlotsByDay,
    OrgSubCollection.Bookings,
    Collection.PublicOrgInfo,
    BookingSubCollection.BookedSlots,
    BookingSubCollection.Calendar,
  ]);

  // Get customer data necessary for rendering/functoinality
  const customerData = useSelector(getBookingsCustomer);

  const additionalButtons = (
    <>
      <TabItem Icon={Calendar as any} label="Book" />
      <TabItem Icon={AccountCircle as any} label="Calendar" />
    </>
  );

  return (
    <Layout additionalButtons={additionalButtons} user={customerData}>
      <CalendarNav date={testDate} jump="month" />
      <div className="content-container">
        <div className="px-[44px]">
          {daysToRender.map((day) => (
            <SlotsDayContainer key={day.toISODate()} date={day}>
              {slotsToRender.map((slot) => (
                <IntervalCardGroup key={slot.type} {...slot} />
              ))}
            </SlotsDayContainer>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CustomerArea;
