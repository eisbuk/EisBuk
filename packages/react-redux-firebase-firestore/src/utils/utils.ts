import {
  Collection,
  OrgSubCollection,
  BookingSubCollection,
} from "@eisbuk/shared";

import { SubscriptionMeta, SubscriptionWhitelist } from "../types";

import { FirestoreListenerConstraint } from "../thunks/subscribe";

export const getConstraintForColl = (
  collection: SubscriptionWhitelist,
  meta: SubscriptionMeta
): FirestoreListenerConstraint | null => {
  const { organization, secretKey = "", currentDate } = meta;

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
    SubscriptionWhitelist,
    FirestoreListenerConstraint | null
  > = {
    [Collection.Organizations]: { documents: [organization] },
    [Collection.PublicOrgInfo]: { documents: [organization] },
    [OrgSubCollection.Attendance]: { range },
    [OrgSubCollection.Bookings]: { documents: [secretKey] },
    [OrgSubCollection.SlotsByDay]: { documents },
    [OrgSubCollection.Customers]: null,
    [BookingSubCollection.BookedSlots]: { range },
    [BookingSubCollection.AttendedSlots]: { range },
    [BookingSubCollection.Calendar]: null,
  };

  return collectionConstraintLookup[collection];
};

export const getCollectionPath = (
  collection: SubscriptionWhitelist,
  meta: Omit<SubscriptionMeta, "currentDate">
): string => {
  const { organization, secretKey = "" } = meta;

  const organizationPath = [Collection.Organizations, organization].join("/");

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
      secretKey,
      BookingSubCollection.BookedSlots,
    ].join("/"),
    [BookingSubCollection.AttendedSlots]: [
      organizationPath,
      OrgSubCollection.Bookings,
      secretKey,
      BookingSubCollection.AttendedSlots,
    ].join("/"),
    [BookingSubCollection.Calendar]: [
      organizationPath,
      OrgSubCollection.Bookings,
      secretKey,
      BookingSubCollection.Calendar,
    ].join("/"),
  };

  return collectionPathLookup[collection];
};
