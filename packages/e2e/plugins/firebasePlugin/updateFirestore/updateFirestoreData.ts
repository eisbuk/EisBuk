import { DocumentReference, DocumentData } from "@google-cloud/firestore";

import {
  BookingSubCollection,
  Customer,
  CustomerBookings,
  OrganizationData,
  OrgSubCollection,
  SlotAttendnace,
  SlotInterface,
} from "@eisbuk/shared";

export const updateOrganization = async (
  orgRef: DocumentReference<DocumentData>,
  data: OrganizationData
) => orgRef.set(data, { merge: true });

export const updateCustomers = async (
  orgRef: DocumentReference<DocumentData>,
  documents: Record<string, Customer>
) =>
  Promise.all(
    Object.entries(documents).map(([docId, docData]) =>
      orgRef
        .collection(OrgSubCollection.Customers)
        .doc(docId)
        .set(docData, { merge: true })
    )
  );

export const updateSlots = async (
  orgRef: DocumentReference<DocumentData>,
  documents: Record<string, SlotInterface>
) =>
  Promise.all(
    Object.entries(documents).map(([docId, docData]) =>
      orgRef
        .collection(OrgSubCollection.Slots)
        .doc(docId)
        .set(docData, { merge: true })
    )
  );

export const updateBookings = async (
  orgRef: DocumentReference<DocumentData>,
  documents: Record<string, CustomerBookings>
) =>
  Promise.all(
    Object.entries(documents).map(
      async ([secretKey, { bookedSlots, ...bookingsDoc }]) => {
        const bookingRef = orgRef
          .collection(OrgSubCollection.Bookings)
          .doc(secretKey);

        // We're running 'update' instead of 'set' as that gives us the assurence that the bookings doc
        // has been created (by customer creation data trigger), before update, and, in effect, it gives us the assurence
        // that the customer exists.
        await waitFor(() => {
          bookingRef.update(bookingsDoc);
        });

        // Save booked slots
        if (bookedSlots) {
          await Promise.all(
            Object.entries(bookedSlots).map(async ([slotId, bookedSlot]) => {
              // Wait for the slot to be created before creating booked slot
              await waitFor(async () => {
                const { exists } = await orgRef
                  .collection(OrgSubCollection.Slots)
                  .doc(slotId)
                  .get();
                if (!exists) {
                  throw new Error(
                    `update booksings: slot '${slotId}' not found`
                  );
                }
              });
              return bookingRef
                .collection(BookingSubCollection.BookedSlots)
                .doc(slotId)
                .set(bookedSlot, { merge: true });
            })
          );
        }
      }
    )
  );

export const updateAttendance = async (
  orgRef: DocumentReference<DocumentData>,
  documents: Record<string, SlotAttendnace>
) =>
  Promise.all(
    Object.entries(documents).map(async ([slotId, attendance]) =>
      // We're running waitFor here because we want to make sure that the attendance entry exists (created by slot creation data trigger)
      // before updating it (hence the 'update', not 'set') and 'waitFor' allows us to rerun the operation until succesful (or timeout)
      waitFor(() =>
        orgRef
          .collection(OrgSubCollection.Attendance)
          .doc(slotId)
          .update(attendance)
      )
    )
  );

/**
 * Runs the callback with 50 ms interval until the assertion is fulfilled or it times out.
 * If it times out, it rejects with the latest error.
 * @param {Function} cb The callback to run (this would normally hold assertions)
 * @param {number} [timeout] The timeout in ms
 */
export const waitFor = (cb: () => any | Promise<any>, timeout = 2000) => {
  return new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let error: any = null;

    // Retry the assertion every 50ms
    const interval = setInterval(() => {
      // Run callback as a promise (this way we're able to .then/.catch regardless of the 'cb' being sync or async)
      (async () => cb())()
        .then(() => {
          if (interval) {
            clearInterval(interval);
          }
          return resolve();
        })
        .catch((err) => {
          // Store the error to reject with later (if timed out)
          error = err;
        });
    }, 50);

    // When timed out, reject with the latest error
    setTimeout(() => {
      clearInterval(interval);
      reject(error);
    }, timeout);
  });
};
