import { Customer, SlotInterface } from "eisbuk-shared";

/**
 * Dispatches booked interval to firestore.
 * Additionally, it cancels booked interval for the same slot if one is already booked.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const bookInterval = (params: {
  slotId: SlotInterface["id"];
  secretKey: Customer["secretKey"];
  bookedInterval: string;
}): void => {};

/**
 * Cancels booked inteval of the provided slot for provided customer.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const cancelBooking = (params: {
  slotId: SlotInterface["id"];
  secretKey: Customer["secretKey"];
}): void => {};
