import { DateTime } from "luxon";

type TestIDList = [
  // #region SlotCard
  "slot-card",
  // #endregion SlotCard

  // #region SlotForm
  "slot-form-title",
  "form-cancel-button",
  "form-confirm-button",

  "delete-interval-button",
  "start-time-input",
  "start-time-error",
  "end-time-input",
  "end-time-error",

  "increment-button",
  "decrement-button",

  "select-type-field",
  "select-categories-field",
  "time-interval-field",
  "hover-text",
  // #endregion SlotForm

  // #region ConfirmDialog
  "confirm-dialog-yes-button",
  "confirm-dialog-no-button",
  // #endregion ConfirmDialog

  // #region ConfirmDialog
  "input-dialog-submit-button",
  "input-dialog-email-input",
  // #endregion ConfirmDialog

  // #region SlotsDayContainer
  "slots-day-container",
  "slots-day-content",
  // #endregion SlotsDayContainer

  // #region SlotOperationButtons
  "new-slot-button",
  "edit-slot-button",
  // "copy-button",
  "copy-week-button",
  "paste-button",
  "delete-button",
  "copied-slots-week-badge",
  // #endregion SlotOperationButtons

  // #region SlotAlerts
  "no-slots-date",
  // #endregion SlotAlerts

  // #region DateNavigation
  "date-navigation-next-page",
  "date-navigation-previous-page",
  // #endregion DateNavigation

  // #region DateSwitcher
  "calendar-menu",
  "picked-day",
  "day-with-slots",
  "day-with-booked-slots",
  // #endregion DateSwitcher

  // #region BookingCard
  "booking-interval-card",
  "booking-calendar-card",
  "book-button",
  // #endregion BookingCard

  // #region CustomerList
  "customer-list",
  // #endregion CustomerList

  // #region CustomerGrid
  "customer-grid",
  "customer-dialog",
  // #endregion CustomerGrid

  // #region DebugMenu
  "debug-button",
  "create-athletes",
  // #endregion DebugMenu

  // #region Notifications
  "notification-button",
  "notification-toast",
  // #endregion Notifications

  // #region ActionButton
  "add-athlete",
  "add-to-calendar",
  // #endregion ActionButton

  // #region AthleteForm
  "birthday-input",
  // #endregion AthleteForm

  // #region AttendanceIntervals
  "primary-interval",
  "custom-interval-input",
  "cancel-custom-interval",
  "add-custom-interval"
  // #endregion AttendanceIntervals
];
export type TestID = TestIDList[number];

// #region test-id-with-metadata
/** A lookup of all test ids which require metadata and their corresponding metadata interface */
export interface TestIDMetaLookup {
  "copy-day-button": { date: DateTime };
  "copied-slots-day-badge": { date: DateTime };
}
export type TestIDWithMeta = keyof TestIDMetaLookup;

/** A lookup of test ids (requring metadata) and handlers - processing their metadata and returning a constructed test id */
const applyMetaLookup: {
  [key in TestIDWithMeta]: (meta: TestIDMetaLookup[key]) => string;
} = {
  "copy-day-button": (meta) => `copy-day-button-${meta.date.toISODate()}`,
  "copied-slots-day-badge": (meta) =>
    `copied-slots-day-badge-${meta.date.toISODate()}`,
};

/** A type guard/predicate function checking if the `id` is of type `TestID` (without meta) or `TestIDWithMeta` */
const hasMeta = (id: TestID | TestIDWithMeta): id is TestIDWithMeta =>
  Boolean(applyMetaLookup[id as TestIDWithMeta]);

/** Constructs a test id by applying its metadata in a correct manner */
const applyMeta = <I extends TestIDWithMeta>(
  id: I,
  meta: TestIDMetaLookup[I]
): string => applyMetaLookup[id](meta);
// #endregion test-id-with-metadata

export function testId<I extends TestIDWithMeta>(
  id: I,
  meta: TestIDMetaLookup[I]
): string;
export function testId(id: TestID): string;
/** */
export function testId<I extends TestID | TestIDWithMeta>(
  id: I,
  meta?: I extends TestIDWithMeta ? TestIDMetaLookup[I] : never
): string {
  if (hasMeta(id)) {
    return applyMeta(id, meta!);
  }
  return id;
}
