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

import { getMonthDiff } from "@/utils/date";

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
  const deadline = isExtendedDateCurrentMonth(month, extendedDate)
    ? extendedDate
    : currentMonthDeadline;
  const deadlinePassed = deadline.diff(systemDate).milliseconds <= 0;

  // Get is booking allowed
  const isBookingAllowed = isAdmin || !deadlinePassed;

  const variant = deadlinePassed
    ? BookingsCountdownVariant.BookingsLocked
    : isExtendedDateCurrentMonth(month, extendedDate)
    ? BookingsCountdownVariant.SecondDeadline
    : BookingsCountdownVariant.FirstDeadline;

  return { month, isBookingAllowed, deadline, countdownVariant: variant };
};

const isExtendedDateCurrentMonth = (
  currentDate: DateTime,
  extendedDate?: DateTime
): extendedDate is DateTime =>
  Boolean(extendedDate && getMonthDiff(extendedDate, currentDate) === 0);

export default useBookingsDeadlines;
