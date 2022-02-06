import { doc, getDoc, setDoc, deleteDoc } from "@firebase/firestore";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import pRetry from "p-retry";
import { DateTime } from "luxon";

import {
  BookingSubCollection,
  Category,
  Collection,
  OrgSubCollection,
  SlotAttendnace,
  SlotType,
} from "eisbuk-shared";

import { __organization__ } from "@/lib/constants";

import { getTestEnv } from "@/__testSetup__/getTestEnv";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { baseSlot } from "@/__testData__/slots";
import { saul } from "@/__testData__/customers";
import { getCustomerBase } from "@/__testUtils__/customers";

describe("Firestore rules", () => {
  describe("Organization rules", () => {
    testWithEmulator(
      "should allow organziation admin read and write access to organization",
      async () => {
        const db = await getTestEnv({});
        const orgRef = doc(db, Collection.Organizations, __organization__);
        // check read access
        await assertSucceeds(getDoc(orgRef));
        // check write access
        await assertSucceeds(
          setDoc(orgRef, { admins: ["new_admin@gmail.com"] })
        );
      }
    );

    testWithEmulator(
      "should not allow read nor write access to an unauth user",
      async () => {
        const db = await getTestEnv({ auth: false });
        const orgRef = doc(db, Collection.Organizations, __organization__);
        // check read access
        await assertFails(getDoc(orgRef));
        // check write access
        await assertFails(setDoc(orgRef, { admins: ["new_admin@gmail.com"] }));
      }
    );

    testWithEmulator(
      "should not allow read nor write access to authenticated user if not admin for current organization",
      async () => {
        const db = await getTestEnv({
          // create a new organization of which the current user (`test@eisbuk.it`) is not admin
          setup: (db) =>
            setDoc(
              doc(db, Collection.Organizations, "different-organization"),
              { admins: ["different-admin"] }
            ),
        });
        const orgRef = doc(
          db,
          Collection.Organizations,
          "different-organization"
        );
        // check read access
        await assertFails(getDoc(orgRef));
        // check write access
        await assertFails(setDoc(orgRef, { admins: ["new_admin@gmail.com"] }));
      }
    );
  });

  describe("Slots rules", () => {
    /**
     * Path to a slot with baseSlot id.
     * We're using this for most of the tests
     */
    const pathToSlots = [
      Collection.Organizations,
      __organization__,
      OrgSubCollection.Slots,
    ].join("/");
    const pathToSlot = [pathToSlots, baseSlot.id].join("/");

    testWithEmulator("should not allow access to unauth user", async () => {
      const db = await getTestEnv({
        auth: false,
        // create test slot in the db
        setup: (db) => setDoc(doc(db, pathToSlot), baseSlot),
      });
      const slotRef = doc(db, pathToSlot);
      // check read access
      await assertFails(getDoc(slotRef));
      // check write access
      await assertFails(
        setDoc(doc(db, pathToSlots, "some-id"), {
          ...baseSlot,
          id: "some-id",
        })
      );
      // check delete access
      await assertFails(deleteDoc(slotRef));
    });

    testWithEmulator(
      "should allow access if organization admin (for delete) and slot interface is correct (for write/update)",
      async () => {
        const db = await getTestEnv({});
        const slotRef = doc(db, pathToSlot);
        // check create access
        await assertSucceeds(setDoc(slotRef, baseSlot));
        // check read access
        await assertSucceeds(getDoc(slotRef));
        // check update access
        await assertSucceeds(
          setDoc(slotRef, { ...baseSlot, type: SlotType.OffIceDancing })
        );
        // check delete access
        await assertSucceeds(
          setDoc(slotRef, { ...baseSlot, type: SlotType.OffIceDancing })
        );
      }
    );

    testWithEmulator(
      "should not allow create/update if slot date not valid",
      async () => {
        const db = await getTestEnv({});
        await assertFails(
          setDoc(doc(db, pathToSlot), { ...baseSlot, date: "2022-24-01" })
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if slot type not valid",
      async () => {
        const db = await getTestEnv({});
        await assertFails(
          setDoc(doc(db, pathToSlot), {
            ...baseSlot,
            type: "non-existing-slot-type",
          })
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if slot category not valid",
      async () => {
        const db = await getTestEnv({});
        await assertFails(
          setDoc(doc(db, pathToSlot), {
            ...baseSlot,
            categories: [Category.Adults, "non-existing-category"],
          })
        );
      }
    );
    /**
     * @TODO as firestore.rules don't allow loops or iterations
     * we need to apply this when we agree on maximum number of intervals per slot
     */
    // testWithEmulator(
    //   "should not allow create/update if intervals not valid",
    //   async () => {
    //     const db = await getTestEnv({});
    //     const slotRef = doc(db, pathToSlot);
    //     // check invalid interval
    //     await assertFails(
    //       setDoc(slotRef, {
    //         ...baseSlot,
    //         intervals: {
    //           ["10:00-123"]: {
    //             startTime: "10:00",
    //             endTime: "123",
    //           },
    //         },
    //       })
    //     );
    //     // check inconsistent key-value interval
    //     await assertFails(
    //       setDoc(slotRef, {
    //         ...baseSlot,
    //         intervals: {
    //           ["10:00-11:00"]: {
    //             startTime: "10:00",
    //             endTime: "12:00",
    //           },
    //         },
    //       })
    //     );
    //     // check impossible (negative duration) interval
    //     await assertFails(
    //       setDoc(slotRef, {
    //         ...baseSlot,
    //         intervals: {
    //           ["10:00-09:00"]: {
    //             startTime: "10:00",
    //             endTime: "09:00",
    //           },
    //         },
    //       })
    //     );
    //   }
    // );
  });

  describe("SlotsByDay rules", () => {
    /**
     * A month string used throughout the tests
     */
    const monthStr = baseSlot.date.substring(0, 7);
    const pathToMonth = [
      Collection.Organizations,
      __organization__,
      OrgSubCollection.SlotsByDay,
      monthStr,
    ].join("/");

    const pathToSlot = [
      Collection.Organizations,
      __organization__,
      OrgSubCollection.Slots,
      baseSlot.id,
    ].join("/");

    testWithEmulator("should allow read access to all", async () => {
      const db = await getTestEnv({
        auth: false,
        setup: async (db) => {
          await setDoc(doc(db, pathToSlot), baseSlot);
          // wait for 'slotsByDay' aggregation
          await pRetry(async () => (await getDoc(doc(db, pathToMonth))).exists);
        },
      });
      await assertSucceeds(getDoc(doc(db, pathToMonth)));
    });

    testWithEmulator(
      "should not allow write access (the collection is updated by cloud functions)",
      async () => {
        const db = await getTestEnv({});
        await assertFails(
          setDoc(doc(db, pathToMonth), {
            [baseSlot.date]: { [baseSlot.id]: baseSlot },
          })
        );
      }
    );
  });

  describe("Bookings rules", () => {
    /**
     * Path to bookings for "saul". We're using this for all tests
     */
    const saulBookingsPath = [
      Collection.Organizations,
      __organization__,
      OrgSubCollection.Bookings,
      saul.secretKey,
    ].join("/");

    testWithEmulator(
      "should allow anybody read access to bookings document",
      async () => {
        const db = await getTestEnv({
          auth: false,
          setup: (db) =>
            setDoc(doc(db, saulBookingsPath), getCustomerBase(saul)),
        });
        await assertSucceeds(getDoc(doc(db, saulBookingsPath)));
      }
    );

    testWithEmulator(
      "should not allow anybody write access to bookings document (as it's handled through cloud functions)",
      async () => {
        const db = await getTestEnv({
          setup: (db) =>
            setDoc(doc(db, saulBookingsPath), getCustomerBase(saul)),
        });
        const saulBookingsDoc = doc(db, saulBookingsPath);
        // check update
        await assertFails(
          setDoc(saulBookingsDoc, {
            ...getCustomerBase(saul),
            name: "not-saul",
          })
        );
        // check delete
        await assertFails(deleteDoc(saulBookingsDoc));
      }
    );

    /**
     * A version of `baseSlot` updated so that it accepts saul's
     * category and has two intervals (for update testing)
     */
    const testSlot = {
      ...baseSlot,
      // the category is the same as saul ("competitive")
      categories: [Category.Competitive],
      intervals: {
        ["09:00-10:00"]: { startTime: "09:00", endTime: "10:00" },
        ["09:00-10:30"]: { startTime: "09:00", endTime: "10:30" },
      },
    };
    /**
     * Intervals existing in test slot
     */
    const testIntervals = Object.keys(testSlot.intervals);
    /**
     * A path to test slot
     */
    const testSlotPath = [
      Collection.Organizations,
      __organization__,
      OrgSubCollection.Slots,
      baseSlot.id,
    ].join("/");
    /**
     * Path to bookings for saul for base slot
     */
    const bookedSlotPath = [
      saulBookingsPath,
      BookingSubCollection.BookedSlots,
      baseSlot.id,
    ].join("/");

    testWithEmulator(
      "should allow anybody to read and write (create/update/delete) booked slots (semi auth is done by possesion of 'secretKey')",
      async () => {
        const db = await getTestEnv({
          auth: false,
          setup: async (db) =>
            await Promise.all([
              // create test slot (as it's used to check compatibility with booking)
              setDoc(doc(db, testSlotPath), testSlot),
              // create saul's bookings entry (CustomerBase) as it's used to check category
              setDoc(doc(db, saulBookingsPath), getCustomerBase(saul)),
            ]),
        });
        const bookedSlotRef = doc(db, bookedSlotPath);
        // check create
        await assertSucceeds(
          setDoc(bookedSlotRef, {
            date: testSlot.date,
            interval: testIntervals[0],
          })
        );
        // check read
        await assertSucceeds(getDoc(bookedSlotRef));
        // check update
        await assertSucceeds(
          setDoc(bookedSlotRef, {
            date: testSlot.date,
            interval: testIntervals[1],
          })
        );
        // check delete
        await assertSucceeds(deleteDoc(bookedSlotRef));
      }
    );

    testWithEmulator(
      "should not allow create/update of booking subscribing to non-existing slot",
      async () => {
        const db = await getTestEnv({
          auth: false,
          setup: (db) => setDoc(doc(db, testSlotPath), testSlot),
        });
        await assertFails(
          setDoc(
            doc(
              db,
              saulBookingsPath,
              BookingSubCollection.BookedSlots,
              "non-existing-slot-id"
            ),
            {
              date: testSlot.date,
              interval: testIntervals[0],
            }
          )
        );
      }
    );
    testWithEmulator(
      "should not allow create/update of booking subscribing to non-existing interval",
      async () => {
        const db = await getTestEnv({
          auth: false,
          setup: (db) => setDoc(doc(db, testSlotPath), testSlot),
        });
        await assertFails(
          setDoc(doc(db, bookedSlotPath), {
            date: testSlot.date,
            interval: testIntervals[0],
          })
        );
      }
    );
    testWithEmulator(
      "should not allow create/update of invalid booking entry",
      async () => {
        const db = await getTestEnv({
          auth: false,
          setup: (db) => setDoc(doc(db, testSlotPath), testSlot),
        });
        // check entry <-> subscribed slot `date` mismatch
        await assertFails(
          setDoc(doc(db, bookedSlotPath), {
            date: DateTime.fromISO(testSlot.date).plus({ days: 1 }).toISODate(),
            interval: testIntervals[0],
          })
        );
      }
    );
    testWithEmulator(
      "should not allow customer to subscribe to slot not supporting their category",
      async () => {
        const db = await getTestEnv({
          auth: false,
          setup: (db) =>
            setDoc(doc(db, testSlotPath), {
              ...testSlot,
              // saul is category = "competitive"
              category: [Category.Adults],
            }),
        });
        await assertFails(
          setDoc(doc(db, bookedSlotPath), {
            date: testSlot.date,
            interval: testIntervals[0],
          })
        );
      }
    );
  });

  describe("Customers rules", () => {
    const saulPath = [
      Collection.Organizations,
      __organization__,
      OrgSubCollection.Customers,
      saul.id,
    ].join("/");

    testWithEmulator("should only allow admin access", async () => {
      const db = await getTestEnv({
        auth: false,
        setup: (db) => setDoc(doc(db, saulPath), saul),
      });
      // check read
      await assertFails(getDoc(doc(db, saulPath)));
      // check write
      await assertFails(
        setDoc(doc(db, saulPath), { ...saul, name: "not-saul" })
      );
      // check delete
      await assertFails(deleteDoc(doc(db, saulPath)));
    });

    testWithEmulator("should allow read/write to org admin", async () => {
      const db = await getTestEnv({
        setup: (db) => setDoc(doc(db, saulPath), saul),
      });
      // check read
      await assertSucceeds(getDoc(doc(db, saulPath)));
      // check write
      await assertSucceeds(
        setDoc(doc(db, saulPath), {
          ...saul,
          category: Category.PreCompetitive,
        })
      );
      // check delete
      await assertSucceeds(deleteDoc(doc(db, saulPath)));
    });

    testWithEmulator(
      "should not allow create/update if required fields (name, surname) not provided",
      async () => {
        const db = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, ...noNameSaul } = saul;
        await assertFails(setDoc(doc(db, saulPath), noNameSaul));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { surname, ...noSurnameSaul } = saul;
        await assertFails(setDoc(doc(db, saulPath), noSurnameSaul));
      }
    );
    testWithEmulator(
      "should not allow create/update if 'covidCertificateReleaseDate' provided, but not a valid date",
      async () => {
        const db = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { covidCertificateReleaseDate, ...noCovidSaul } = saul;
        await assertFails(
          setDoc(doc(db, saulPath), {
            ...saul,
            covidCertificateReleaseDate: "2022-22-24",
          })
        );
        // should allow if (optional) `covidCertificateReleaseDate` is not provided
        await assertSucceeds(setDoc(doc(db, saulPath), noCovidSaul));
      }
    );
    testWithEmulator(
      "should not allow create/update if 'certificateExpiration' provided, but not a valid date",
      async () => {
        const db = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { certificateExpiration, ...noCertificateSaul } = saul;
        await assertFails(
          setDoc(doc(db, saulPath), {
            ...saul,
            certificateExpiration: "2022-22-24",
          })
        );
        // should allow if (optional) `certificateExpiration` is not provided
        await assertSucceeds(setDoc(doc(db, saulPath), noCertificateSaul));
      }
    );
    testWithEmulator(
      "should not allow create/update if birthday provided, but not a valid date",
      async () => {
        const db = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { birthday, ...noBirthdaySaul } = saul;
        await assertFails(
          setDoc(doc(db, saulPath), {
            ...saul,
            birthday: "2022-22-24",
          })
        );
        // should allow if (optional) `birthday` is not provided
        await assertSucceeds(setDoc(doc(db, saulPath), noBirthdaySaul));
      }
    );
    testWithEmulator(
      "should not allow create/update if phone provided but not valid",
      async () => {
        const db = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { phone, ...noPhoneSaul } = saul;
        await assertFails(
          setDoc(doc(db, saulPath), {
            ...saul,
            phone: "not-a-number-string",
          })
        );
        // should allow if (optional) `phone` is not provided
        await assertSucceeds(setDoc(doc(db, saulPath), noPhoneSaul));
        // should allow `phone` string starting with "+" sign
        await assertSucceeds(
          setDoc(doc(db, saulPath), { ...saul, phone: `+${saul.phone}` })
        );
        /** @TODO We might want to require certain length range in the future */
      }
    );
    testWithEmulator(
      "should not allow create/update if email provided but not valid",
      async () => {
        const db = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email, ...noEmailSaul } = saul;
        await assertFails(
          setDoc(doc(db, saulPath), {
            ...saul,
            email: "no-domain-email@",
          })
        );
        // should allow if (optional) `email` is not provided
        await assertSucceeds(setDoc(doc(db, saulPath), noEmailSaul));
      }
    );
    testWithEmulator(
      "should not allow create/update if invalid category",
      async () => {
        const db = await getTestEnv({});
        // check valid `category`
        await assertFails(
          setDoc(doc(db, saulPath), {
            ...saul,
            category: "not-a-valid-category",
          })
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if 'covidCertificateSuspended' provided, but not boolean",
      async () => {
        const db = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { covidCertificateSuspended, ...noSuspendedSaul } = saul;
        await assertFails(
          setDoc(doc(db, saulPath), {
            ...saul,
            covidCertificateSuspended: "not-a-boolean",
          })
        );
        await assertSucceeds(setDoc(doc(db, saulPath), noSuspendedSaul));
      }
    );
    /** @TODO Add check for card (subscription) number */
  });

  describe("Attendance rules", () => {
    /**
     * Path to attendance entry for base slot
     */
    const attendanceSlotPath = [
      Collection.Organizations,
      __organization__,
      OrgSubCollection.Attendance,
      baseSlot.id,
    ].join("/");
    /**
     * A basic (empty) attendance with baseSlot `date`
     */
    const testAttendance: SlotAttendnace = {
      date: baseSlot.date,
      attendances: {},
    };

    testWithEmulator(
      "should not allow non-admin users read nor write access",
      async () => {
        const db = await getTestEnv({
          auth: false,
          setup: (db) => setDoc(doc(db, attendanceSlotPath), testAttendance),
        });
        // check read
        await assertFails(getDoc(doc(db, attendanceSlotPath)));
        // check write
        await assertFails(
          setDoc(doc(db, attendanceSlotPath), {
            ...testAttendance,
            attendances: {
              [saul.id]: {
                bookedInterval: "10:00-11:00",
                attendedInterval: null,
              },
            },
          })
        );
        // check delete
        await assertFails(deleteDoc(doc(db, attendanceSlotPath)));
      }
    );

    testWithEmulator(
      "should allow admin read and update access (create/delete are handled through cloud functions)",
      async () => {
        const db = await getTestEnv({
          setup: (db) => setDoc(doc(db, attendanceSlotPath), testAttendance),
        });
        // check read
        await assertSucceeds(getDoc(doc(db, attendanceSlotPath)));
        // check update
        await assertSucceeds(
          setDoc(doc(db, attendanceSlotPath), {
            ...testAttendance,
            attendances: {
              [saul.id]: {
                bookedInterval: "10:00-11:00",
                attendedInterval: null,
              },
            },
          })
        );
        // check create
        await assertFails(
          setDoc(
            doc(
              db,
              [
                Collection.Organizations,
                __organization__,
                OrgSubCollection.Attendance,
                "new-attendance",
              ].join("/")
            ),
            testAttendance
          )
        );
        // check delete
        await assertFails(deleteDoc(doc(db, attendanceSlotPath)));
      }
    );
    testWithEmulator(
      "should not allow date update (as that is handled through cloud functions on slot update)",
      async () => {
        const db = await getTestEnv({
          setup: (db) => setDoc(doc(db, attendanceSlotPath), testAttendance),
        });
        await assertFails(
          setDoc(doc(db, attendanceSlotPath), {
            ...testAttendance,
            date: DateTime.fromISO(testAttendance.date)
              .plus({ days: 1 })
              .toISODate(),
          })
        );
        // if date is the same, but is still included in update payload, should allow
        await assertSucceeds(
          setDoc(doc(db, attendanceSlotPath), {
            date: testAttendance.date,
            attendances: {
              [saul.id]: {
                bookedInterval: null,
                attendedInterval: "10:00-11:00",
              },
            },
          })
        );
      }
    );
  });

  describe("EmailQueue rules", () => {
    testWithEmulator(
      "should not allow anybody read/write access to 'emailQueue' as it's written to only by cloud functions",
      async () => {
        const db = await getTestEnv({
          setup: (db) =>
            setDoc(doc(db, Collection.EmailQueue, "mail-id"), {
              message: { html: "Hello world", subject: "Subject" },
              to: "ikusteu@gmail.com",
            }),
        });
        // check read
        await assertFails(getDoc(doc(db, Collection.EmailQueue, "mail-id")));
        // check write
        await assertFails(
          setDoc(doc(db, Collection.EmailQueue, "new-mail-id"), {
            message: {
              html: "Hello from the other side",
              subject: "Subject 2",
            },
            to: "ikusteu@gmail.com",
          })
        );
        // check delete
        await assertFails(deleteDoc(doc(db, Collection.EmailQueue, "mail-id")));
      }
    );
  });

  describe("Secrets rules", () => {
    testWithEmulator(
      "should not allow anybody read/write access to 'secrets', it should only be written to from firebase console",
      async () => {
        const db = await getTestEnv({
          setup: (db) =>
            setDoc(doc(db, Collection.Secrets, "test-organization"), {
              smsAuthToken: "test-token",
            }),
        });
        // check read
        await assertFails(
          getDoc(doc(db, Collection.Secrets, "test-organization"))
        );
        // check write
        await assertFails(
          setDoc(
            doc(db, Collection.Secrets, "test-organization"),
            {
              emailAuthToken: "email-test-token",
            },
            { merge: true }
          )
        );
        // check delete
        await assertFails(
          deleteDoc(doc(db, Collection.Secrets, "test-organization"))
        );
      }
    );
  });
});
