import {
  BookingSubCollection,
  Collection,
  DeliveryQueue,
  OrgSubCollection,
} from "@eisbuk/shared";

interface GetCollectionPath<S extends string[] = []> {
  (organization: string, ...args: S): string;
}
type GetDocumentPath<S extends string[] = []> = GetCollectionPath<
  [string, ...S]
>;

// #region getCollectionPath
export const getSlotsPath: GetCollectionPath = (organization) =>
  [Collection.Organizations, organization, OrgSubCollection.Slots].join("/");
export const getSlotsByDayPath: GetCollectionPath = (organization) =>
  [Collection.Organizations, organization, OrgSubCollection.SlotsByDay].join(
    "/"
  );
export const getCustomersPath: GetCollectionPath = (organization) =>
  [Collection.Organizations, organization, OrgSubCollection.Customers].join(
    "/"
  );
export const getBookingsPath: GetCollectionPath = (organization) =>
  [Collection.Organizations, organization, OrgSubCollection.Bookings].join("/");
export const getAttendancePath: GetCollectionPath = (organization) =>
  [Collection.Organizations, organization, OrgSubCollection.Attendance].join(
    "/"
  );
export const getBookedSlotsPath: GetCollectionPath<[string]> = (
  organization,
  secretKey
) =>
  [
    getBookingsDocPath(organization, secretKey),
    BookingSubCollection.BookedSlots,
  ].join("/");

export const getEmailQueuePath: GetCollectionPath = (organization) =>
  [Collection.DeliveryQueues, organization, DeliveryQueue.EmailQueue].join("/");
export const getSMSQueuePath: GetCollectionPath = (organization) =>
  [Collection.DeliveryQueues, organization, DeliveryQueue.SMSQueue].join("/");
// #endregion getCollectionPath

// #region getDocPath
export const getSlotDocPath: GetDocumentPath = (organization, id) =>
  [Collection.Organizations, organization, OrgSubCollection.Slots, id].join(
    "/"
  );
export const getSlotsByDayDocPath: GetDocumentPath = (organization, monthStr) =>
  [
    Collection.Organizations,
    organization,
    OrgSubCollection.SlotsByDay,
    monthStr,
  ].join("/");

export const getCustomerDocPath: GetDocumentPath = (organization, id) =>
  [getCustomersPath(organization), id].join("/");
export const getBookingsDocPath: GetDocumentPath = (organization, secretKey) =>
  [getBookingsPath(organization), secretKey].join("/");
export const getAttendanceDocPath: GetDocumentPath = (organization, slotId) =>
  [getAttendancePath(organization), slotId].join("/");
export const getBookedSlotDocPath: GetDocumentPath<[string]> = (
  organization,
  secretKey,
  slotId
) => [getBookedSlotsPath(organization, secretKey), slotId].join("/");

export const getEmailQueueDocPath: GetDocumentPath = (organization, emailId) =>
  [getEmailQueuePath(organization), emailId].join("/");
export const getSMSQueueDocPath: GetDocumentPath = (organization, smsId) =>
  [getSMSQueuePath(organization), smsId].join("/");
// #endregion getDocPath
