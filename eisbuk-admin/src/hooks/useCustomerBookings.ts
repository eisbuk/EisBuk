import { useFirestoreConnect } from "react-redux-firebase";
import { useSelector } from "react-redux";

import {
  BookingSubCollection,
  Customer,
  OrgSubCollection,
} from "eisbuk-shared";

import { getCalendarDay } from "@/store/selectors/app";

import { wrapOrganization } from "@/utils/firestore";

/**
 * A hook in charge of customer oriented firestore subscriptions. Subscribes
 * to customer base info (for bookings) and customers `bookedSlots`. This
 * is used by both customer and admin (as admin can access secret key from `/customers` page)
 */
const useFirestoreBookings = (secretKey: Customer["secretKey"]): void => {
  const currentDate = useSelector(getCalendarDay);

  useFirestoreConnect([
    wrapOrganization({
      collection: OrgSubCollection.Bookings,
      doc: secretKey,
    }),
    wrapOrganization({
      collection: OrgSubCollection.Bookings,
      doc: secretKey,
      storeAs: BookingSubCollection.BookedSlots,
      subcollections: [
        {
          collection: BookingSubCollection.BookedSlots,
          where: [
            ["date", ">=", currentDate.toJSDate()],
            ["date", "<", currentDate.plus({ month: 1 }).toJSDate()],
          ],
        },
      ],
    }),
  ]);

  useFirestoreConnect([]);
};

export default useFirestoreBookings;
