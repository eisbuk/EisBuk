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

import { Category, OrgSubCollection } from "@functions/enums/firestore";

import { LocalStore } from "@/types/store";
import { Slot } from "@functions/types/firestore";

import SlotsPageContainer from "@/containers/SlotsPageContainer";

import { subscribeToSlot, unsubscribeFromSlot } from "@/store/actions/actions";

import { wrapOrganization } from "@/utils/firestore";
import { flatten, getMonthStr } from "@/utils/helpers";

const luxon = new LuxonUtils({ locale: "it" });

/** @TODO refactor to use imported selectors */
const slotsSelector = (state: LocalStore) =>
  flatten(state.firestore.ordered.slotsByDay);
const subscribedSlotsSelector = (state: LocalStore) =>
  state.firestore.data.subscribedSlots;

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

  const allSlotsByDay = _.omitBy(
    useSelector(slotsSelector),
    (el) => typeof el === "string"
  );
  const slots = _.mapValues(allSlotsByDay, (daySlots) =>
    _.pickBy(daySlots, (slot) => {
      return slot.categories.includes(category);
    })
  );
  const subscribedSlots = useSelector(subscribedSlotsSelector);

  const dispatch = useDispatch();
  const onSubscribe = isLoaded(subscribedSlots)
    ? (slot: Slot<"id">) => {
        dispatch(subscribeToSlot(secretKey, slot));
      }
    : undefined;

  const onUnsubscribe = (slot: Slot<"id">) => {
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
