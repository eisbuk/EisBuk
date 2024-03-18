import { useSelector } from "react-redux";
import { DateTime } from "luxon";

import { BookingsCountdownVariant } from "@eisbuk/ui";

import {
  getCalendarDay,
  getSecretKey,
  getSystemDate,
} from "@/store/selectors/app";
import { getIsAdmin } from "@/store/selectors/auth";
import {
  getBookingsCustomer,
  getMonthDeadline,
} from "@/store/selectors/bookings";

const useBookingsDeadlines = () => {
  const secretKey = useSelector(getSecretKey)!;
  const currentDate = useSelector(getCalendarDay);
  const month = currentDate.startOf("month");

  const isAdmin = useSelector(getIsAdmin);

  const { value: systemDate } = useSelector(getSystemDate);

  // Customer's extended date (if any)
  const { extendedDate: _extendedDate } =
    useSelector(getBookingsCustomer(secretKey)) || {};
  const extendedDate = _extendedDate
    ? DateTime.fromISO(_extendedDate).endOf("day")
    : undefined;

  // Deadline
  const currentMonthDeadline = getMonthDeadline(month);
  // Check extended deadline:
  //    - if extended date applicable to current month, use it
  //    - otherwise use current month deadline
  const extendedDeadline = isExtendedDateApplicable(month, extendedDate)
    ? extendedDate
    : currentMonthDeadline;
  // Get applicable deadline:
  //   - if regular deadline hadn't yet passed, use it
  //   - if regular deadline passed, use extended deadline (if any)
  const deadline =
    currentMonthDeadline.diff(systemDate).milliseconds > 0
      ? currentMonthDeadline
      : extendedDeadline;
  const deadlinePassed = deadline.diff(systemDate).milliseconds <= 0;

  // Get is booking allowed
  const isBookingAllowed = isAdmin || !deadlinePassed;

  const variant = deadlinePassed
    ? BookingsCountdownVariant.BookingsLocked
    : deadline.equals(currentMonthDeadline)
    ? BookingsCountdownVariant.FirstDeadline
    : BookingsCountdownVariant.SecondDeadline;

  return { month, isBookingAllowed, deadline, countdownVariant: variant };
};

/** Extended date is applicable if it's after current month's regular deadline and before next month's regular deadline */
const isExtendedDateApplicable = (
  currentDate: DateTime,
  extendedDate?: DateTime
): extendedDate is DateTime => {
  if (!extendedDate) return false;

  const currentMonthDeadline = getMonthDeadline(currentDate);
  const nextMonthDeadline = getMonthDeadline(currentDate.plus({ months: 1 }));

  return (
    extendedDate.diff(currentMonthDeadline).milliseconds >= 0 &&
    extendedDate.diff(nextMonthDeadline).milliseconds < 0
  );
};

export default useBookingsDeadlines;
