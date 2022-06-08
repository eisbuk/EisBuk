import { DateTime } from "luxon";

import {
  Collection,
  OrgSubCollection,
  BookingSubCollection,
} from "@eisbuk/shared";

import { getOrganization } from "@/lib/getters";

import { CollectionSubscription } from "@/types/store";

import { FirestoreListenerConstraint } from "./thunks/subscribe";

import { getSecretKey } from "@/utils/localStorage";

export const getConstraintForColl = (
  collection: CollectionSubscription,
  currentDate: DateTime
): FirestoreListenerConstraint | null => {
  // create date range constraint
  const startDateISO = currentDate
    .minus({ months: 1 })
    .startOf("month")
    .toISODate();
  const endDateISO = currentDate.plus({ months: 1 }).endOf("month").toISODate();
  const range: FirestoreListenerConstraint["range"] = [
    "date",
    startDateISO,
    endDateISO,
  ];

  // create month string documents constraint
  const documents = [-1, 0, 1].map((delta) =>
    currentDate.plus({ months: delta }).toISO().substring(0, 7)
  );

  const collectionConstraintLookup: Record<
    CollectionSubscription,
    FirestoreListenerConstraint | null
  > = {
    [Collection.Organizations]: { documents: [getOrganization()] },
    [Collection.PublicOrgInfo]: { documents: [getOrganization()] },
    [OrgSubCollection.Attendance]: { range },
    [OrgSubCollection.Bookings]: { documents: [getSecretKey()] },
    [OrgSubCollection.SlotsByDay]: { documents },
    [OrgSubCollection.Customers]: null,
    [BookingSubCollection.BookedSlots]: { range },
  };

  return collectionConstraintLookup[collection];
};

export const getCollectionPath = (
  collection: CollectionSubscription
): string => {
  const organizationPath = [Collection.Organizations, getOrganization()].join(
    "/"
  );

  const collectionPathLookup = {
    [Collection.Organizations]: Collection.Organizations,
    [Collection.PublicOrgInfo]: Collection.PublicOrgInfo,

    [OrgSubCollection.Attendance]: [
      organizationPath,
      OrgSubCollection.Attendance,
    ].join("/"),

    [OrgSubCollection.Bookings]: [
      organizationPath,
      OrgSubCollection.Bookings,
    ].join("/"),

    [OrgSubCollection.SlotsByDay]: [
      organizationPath,
      OrgSubCollection.SlotsByDay,
    ].join("/"),

    [OrgSubCollection.Customers]: [
      organizationPath,
      OrgSubCollection.Customers,
    ].join("/"),

    [BookingSubCollection.BookedSlots]: [
      organizationPath,
      OrgSubCollection.Bookings,
      getSecretKey(),
      BookingSubCollection.BookedSlots,
    ].join("/"),
  };

  return collectionPathLookup[collection];
};
