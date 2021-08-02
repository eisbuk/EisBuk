import { useParams } from "react-router-dom";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useFirestoreConnect,
  useFirestore,
  isLoaded,
  WhereOptions,
} from "react-redux-firebase";
import LuxonUtils from "@date-io/luxon";
import _ from "lodash";

import { BookingInfo, Category, OrgSubCollection } from "eisbuk-shared";

import SlotsPageContainer from "@/containers/SlotsPageContainer";

import {
  subscribeToSlot,
  unsubscribeFromSlot,
} from "@/store/actions/bookingOperations";

import { wrapOrganization } from "@/utils/firestore";
import { getMonthStr } from "@/utils/helpers";
import { SlotOperation } from "@/types/slotOperations";
import { getAllSlotsByDay, getSubscribedSlots } from "@/store/selectors/slots";

const luxon = new LuxonUtils();

interface Props {
  category: Category;
  view?: string;
}

const CustomerAreaCalendar: React.FC<Props> = ({
  category,
  view = "slots",
}) => {
  const start = luxon.date().startOf("week");

  const { secretKey } = useParams() as { secretKey: string };

  const [currentDate, onChangeCalendarDate] = useState(start);

  const firestore = useFirestore();

  const monthsToQuery = [
    getMonthStr(currentDate, -1),
    getMonthStr(currentDate, 0),
    getMonthStr(currentDate, 1),
  ];

  const where: WhereOptions[] = [
    ["date", ">=", currentDate.minus({ days: 14 }).toJSDate()],
    ["date", "<", currentDate.plus({ days: 14 }).toJSDate()],
  ];
  useFirestoreConnect([
    wrapOrganization({
      collection: OrgSubCollection.SlotsByDay,
      /** @TEMP find a way to write this propperly */
      where: [(firestore.FieldPath as any).documentId(), "in", monthsToQuery],
    }),
    wrapOrganization({
      collection: OrgSubCollection.Bookings,
      doc: secretKey,
      storeAs: "subscribedSlots",
      subcollections: [
        {
          collection: "data",
          where,
        },
      ],
    }),
  ]);

  const allSlotsByDay = useSelector(getAllSlotsByDay);

  const slots = _.mapValues(allSlotsByDay, (daySlots) =>
    _.pickBy(daySlots, (slot) => {
      return slot.categories.includes(category);
    })
  );
  const subscribedSlots = useSelector(getSubscribedSlots);

  const dispatch = useDispatch();
  const onSubscribe = isLoaded(subscribedSlots)
    ? (bookingInfo: BookingInfo) => {
        dispatch(subscribeToSlot(secretKey, bookingInfo));
      }
    : undefined;

  const onUnsubscribe = (slot: Parameters<SlotOperation>[0]) => {
    dispatch(unsubscribeFromSlot(secretKey, slot));
  };

  return (
    <>
      <SlotsPageContainer
        {...{
          slots,
          currentDate,
          onChangeCalendarDate,
          onSubscribe,
          onUnsubscribe,
          subscribedSlots,
          view,
          isCustomer: true,
        }}
      />
    </>
  );
};

export default CustomerAreaCalendar;
