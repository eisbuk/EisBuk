import { Customer, Slot } from "eisbuk-shared";

/**
 * AttendanceCard should call to this function with customer id and attendance state (boolean for now).
 * The function has no body and we don't need it right now. Use it to test that it has been called with the right
 * parameters from component. We'll implement logic later, separate from component's TDD.
 * @param customerId
 * @param attended
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const markAttendance = (payload: {
  slotId: Slot<"id">["id"];
  userId: Customer["id"];
  attended: boolean;
}): void => {};

export const selectInterval = (payload: {
  slotId: Slot<"id">["id"];
  userId: Customer["id"];
  interval: string;
}): void => {};
