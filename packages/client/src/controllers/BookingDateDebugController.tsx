import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { useDispatch, useSelector } from "react-redux";

import { BookingDateDebugDialog as DebugDialog } from "@eisbuk/ui";
import { updateLocalDocuments } from "@eisbuk/react-redux-firebase-firestore";
import { OrgSubCollection } from "@eisbuk/shared";

import { db } from "@/setup";

import { getOrganization } from "@/lib/getters";

import {
  getBookingsCustomer,
  getMonthDeadline,
} from "@/store/selectors/bookings";
import {
  getCalendarDay,
  getSecretKey,
  getSystemDate,
} from "@/store/selectors/app";
import { resetSystemDate, setSystemDate } from "@/store/actions/appActions";

import {
  FirestoreVariant,
  doc,
  getBookingsDocPath,
  getDoc,
} from "@/utils/firestore";

const BookingDateDebugDialog: React.FC = () => {
  const secretKey = useSelector(getSecretKey) || "";
  const currentDate = useSelector(getCalendarDay);

  const dispatch = useDispatch();

  const systemDateValue = useSelector(getSystemDate).value;
  const systemDate = useDate({
    value: systemDateValue,
    onChange: (date) => dispatch(setSystemDate(date)),
    // Reset the system date on unmount, as it could have only been used (if it had been used at all) for debugging of
    // the current page
    onDestroy: () => dispatch(resetSystemDate()),
  });

  const customer = useSelector(getBookingsCustomer(secretKey));
  const extendedDateValue = DateTime.fromISO(
    customer?.extendedDate || getMonthDeadline(currentDate).toISODate()
  );
  // On extended date change, we're not persisting the change, merely updating the local (redux) state
  const handleExtendedDateChange = (date: DateTime) => {
    const data = { ...customer, extendedDate: date.toISODate() };
    dispatch(
      updateLocalDocuments(OrgSubCollection.Bookings, { [secretKey]: data })
    );
  };
  const resetBookingsCustomer = async () => {
    const firestore = FirestoreVariant.client({ instance: db });
    const docRef = doc(
      firestore,
      getBookingsDocPath(getOrganization(), secretKey)
    );
    const data = await getDoc(docRef).then((d) => d.data()!);
    dispatch(
      updateLocalDocuments(OrgSubCollection.Bookings, { [secretKey]: data })
    );
  };
  const extendedDate = useDate({
    value: extendedDateValue,
    onChange: handleExtendedDateChange,
    onDestroy: resetBookingsCustomer,
  });

  return <DebugDialog systemDate={systemDate} extendedDate={extendedDate} />;
};

type UseDateParams = {
  value: DateTime;
  onChange: (date: DateTime) => void;
  onDestroy?: () => void;
};

const useDate = ({ value, onChange, onDestroy }: UseDateParams) => {
  useEffect(() => {
    return onDestroy;
  }, []);

  const navigate = (days: -1 | 1) => () => onChange(value.plus({ days }));

  const [localDate, setLocalDate] = useState(value.toISODate());
  useEffect(() => {
    setLocalDate(value.toISODate());
  }, [value]);
  const handleChange = (_date: string) => {
    if (isIsoDate(_date)) {
      // If date is a valid ISO string, update the DateTime value
      // Local value is updated as side effect
      onChange(DateTime.fromISO(_date));
    }
    // Update the local value
    setLocalDate(_date);
  };

  return { value: localDate, navigate, onChange: handleChange };
};

const isIsoDate = (date: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(date);

export default BookingDateDebugDialog;
