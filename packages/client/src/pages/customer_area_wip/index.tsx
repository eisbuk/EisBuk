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
  SlotInterface,
} from "@eisbuk/shared";

import BookingsCountdownContainer from "@/controllers/BookingsCountdown";

import useFirestoreSubscribe from "@/react-redux-firebase/hooks/useFirestoreSubscribe";
import {
  getBookingsCustomer,
  getSlotsForBooking,
} from "@/store/selectors/bookings";
import { getCalendarDay } from "@/store/selectors/app";
import { changeCalendarDate } from "@/store/actions/appActions";

import { setSecretKey, unsetSecretKey } from "@/utils/localStorage";
import { bookInterval } from "@/store/actions/bookingOperations";
import { openModal } from "@/features/modal/actions";

/**
 * Customer area page component
 */
const CustomerArea: React.FC = () => {
  const secretKey = useSecretKey();

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

  const daysToRender = useSelector(getSlotsForBooking);

  const { handleBooking, handleCancellation } = useBooking(secretKey);

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

          {daysToRender.map(({ date, slots }) => (
            <SlotsDayContainer date={date}>
              {slots.map(({ interval, ...slot }) => (
                <IntervalCardGroup
                  onBook={handleBooking(slot)}
                  onCancel={handleCancellation(slot, interval)}
                  bookedInterval={interval}
                  {...slot}
                />
              ))}
            </SlotsDayContainer>
          ))}
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

/**
 * Slot booking and cancel logic, abstracted away in a hook for readability.
 */
const useBooking = (secretKey: string) => {
  const dispatch = useDispatch();

  return {
    handleBooking:
      ({ date, id: slotId }: SlotInterface) =>
      (bookedInterval: string) =>
        dispatch(bookInterval({ slotId, bookedInterval, date, secretKey })),

    handleCancellation: (slot: SlotInterface, interval?: string) => () => {
      if (!interval) return;

      const [startTime, endTime] = interval.split("-");

      dispatch(
        openModal({
          component: "CancelBookingDialog",
          props: { ...slot, interval: { startTime, endTime } },
        })
      );
    },
  };
};

export default CustomerArea;
