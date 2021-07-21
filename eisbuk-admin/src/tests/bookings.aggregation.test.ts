import { adminDb } from "./settings";
import { retry, deleteAll } from "./utils";
import { DocumentData } from "@google-cloud/firestore";

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

it("Copies over booking when created", async (done) => {
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

  await retry(
    // Try to fetch the bookingsByDay aggregation until
    // it includes the booking we were asked to
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
    10, // Try the above up to 10 times
    400 // pause 400 ms between tries
  );

  return doc?.data();
};
