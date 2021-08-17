import { adminDb } from "./settings";
import { deleteAll } from "./utils";
import { DocumentData } from "@google-cloud/firestore";
import pRetry from "p-retry";

beforeEach(async () => {
  await deleteAll(["bookings", "bookingsByDay"]);
  await adminDb
    .collection("organizations")
    .doc("default")
    .collection("bookings")
    .doc("foo-secret-key")
    .collection("data")
    .doc("booked-slot-id")
    .delete();
});

const maybeDescribe = process.env.FIRESTORE_EMULATOR_HOST
  ? describe
  : xdescribe;

maybeDescribe("Booking aggregation triggers", () => {
  it("copy over booking when created", async (done) => {
    // 1611964800 → Saturday, January 30, 2021 0:00:00 GMT
    const day = 1611964800;
    await adminDb
      .collection("organizations")
      .doc("default")
      .collection("bookings")
      .doc("foo-secret-key")
      .create({
        customer_id: "booker-id",
      });

    await adminDb
      .collection("organizations")
      .doc("default")
      .collection("bookings")
      .doc("foo-secret-key")
      .collection("data")
      .doc("booked-slot-id")
      .create({
        date: { seconds: day },
        categories: ["agonismo"],
        id: "booked-slot-id",
        duration: 60,
      });
    const record = await waitForBookingWithCondition(
      "2021-01",
      (data) =>
        data && data["booked-slot-id"] && data["booked-slot-id"]["booker-id"]
    );
    expect(record["booked-slot-id"]["booker-id"]).toEqual(60);

    await adminDb
      .collection("organizations")
      .doc("default")
      .collection("bookings")
      .doc("foo-secret-key")
      .collection("data")
      .doc("booked-slot-id")
      .delete();
    await waitForBookingWithCondition(
      "2021-01",
      (data) => !data!["booked-slot-id"]["booker-id"]
    );
    done();
  });
});

// ***** Region Wait For Booking With Condition ***** //
interface WaitForBookingWithCondition {
  (
    monthString: string,
    condition: (data: DocumentData | undefined) => boolean
  ): Promise<DocumentData>;
}

const waitForBookingWithCondition: WaitForBookingWithCondition = async (
  monthStr,
  condition
) => {
  let doc: DocumentData | undefined;

  const coll = adminDb
    .collection("organizations")
    .doc("default")
    .collection("bookingsByDay");

  await pRetry(
    // Try to fetch the bookingsByDay aggregation until
    // it includes the booking we asked for
    async () => {
      doc = await coll.doc(monthStr).get();
      return condition(doc.data())
        ? Promise.resolve()
        : Promise.reject(
            new Error(
              `The booking aggregation ${monthStr} was not updated correctly`
            )
          );
    },
    // Try the above up to 10 times
    // pause 400 ms between tries
    { retries: 10, minTimeout: 400, maxTimeout: 400 }
  );

  return doc?.data();
};
