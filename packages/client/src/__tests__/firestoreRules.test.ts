/**
 * @jest-environment node
 */

import { doc, getDoc, setDoc, deleteDoc } from "@firebase/firestore";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import pRetry from "p-retry";
import { DateTime } from "luxon";

import {
  Category,
  Collection,
  SlotAttendnace,
  SlotType,
  Customer,
  getCustomerBase,
  DeprecatedCategory,
  DeliveryQueue,
} from "@eisbuk/shared";

import { defaultCustomerFormValues } from "@/lib/data";

import { getTestEnv } from "@/__testSetup__/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";

import { baseSlot } from "@/__testData__/slots";
import { saul } from "@/__testData__/customers";
import {
  getAttendanceDocPath,
  getBookedSlotDocPath,
  getBookingsDocPath,
  getCustomerDocPath,
  getEmailProcessDocPath,
  getSlotDocPath,
  getSlotsByDayDocPath,
  getSlotsPath,
} from "@/utils/firestore";

describe("Firestore rules", () => {
  describe("Organization rules", () => {
    testWithEmulator(
      "should allow organziation admin read and write access to organization",
      async () => {
        const { db, organization } = await getTestEnv({});
        const orgRef = doc(db, Collection.Organizations, organization);
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
        const { db, organization } = await getTestEnv({ auth: false });
        const orgRef = doc(db, Collection.Organizations, organization);
        // check read access
        await assertFails(getDoc(orgRef));
        // check write access
        await assertFails(setDoc(orgRef, { admins: ["new_admin@gmail.com"] }));
      }
    );

    testWithEmulator(
      "should not allow read nor write access to authenticated user if not admin for current organization",
      async () => {
        const { db } = await getTestEnv({
          // create a new organization of which the current user (`test@eisbuk.it`) is not admin
          setup: (db) =>
            setDoc(
              doc(db, Collection.Organizations, "different-organization"),
              {
                admins: ["different-admin"],
              }
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
    // const getSlotDocPath(organization, baseSlot.id) = [getSlotsPath(organization), baseSlot.id].join("/");

    testWithEmulator("should not allow access to unauth user", async () => {
      const { db, organization } = await getTestEnv({
        auth: false,
        // create test slot in the db
        setup: (db, { organization }) =>
          setDoc(doc(db, getSlotDocPath(organization, baseSlot.id)), baseSlot),
      });
      console.log("Orgaization:", organization);
      const slotRef = doc(db, getSlotDocPath(organization, baseSlot.id));
      // check read access
      await assertFails(getDoc(slotRef));
      // check write access
      await assertFails(
        setDoc(doc(db, getSlotsPath(organization), "some-id"), {
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
        const { db, organization } = await getTestEnv({});
        const slotRef = doc(db, getSlotDocPath(organization, baseSlot.id));
        // check create access
        await assertSucceeds(setDoc(slotRef, baseSlot));
        // check read access
        await assertSucceeds(getDoc(slotRef));
        // check update access
        await assertSucceeds(
          setDoc(slotRef, { ...baseSlot, type: SlotType.OffIce })
        );
        // check delete access
        await assertSucceeds(deleteDoc(slotRef));
      }
    );

    testWithEmulator(
      "should not allow create/update if slot date not valid",
      async () => {
        const { db, organization } = await getTestEnv({});
        await assertFails(
          setDoc(doc(db, getSlotDocPath(organization, baseSlot.id)), {
            ...baseSlot,
            date: "2022-24-01",
          })
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if slot type not valid",
      async () => {
        const { db, organization } = await getTestEnv({});
        await assertFails(
          setDoc(doc(db, getSlotDocPath(organization, baseSlot.id)), {
            ...baseSlot,
            type: "non-existing-slot-type",
          })
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if slot category not valid",
      async () => {
        const { db, organization } = await getTestEnv({});
        await assertFails(
          setDoc(doc(db, getSlotDocPath(organization, baseSlot.id)), {
            ...baseSlot,
            categories: [
              Category.PreCompetitiveAdults,
              "non-existing-category",
            ],
          })
        );
      }
    );
    testWithEmulator(
      'should allow updating a slot with "adults" category, but disallow new creating new slots with said category',
      () => {
        async () => {
          const slotWithAdults = {
            ...baseSlot,
            categories: [DeprecatedCategory.Adults],
            id: "slot-with-adults",
          };

          const { db, organization } = await getTestEnv({
            setup: (db, { organization }) =>
              Promise.all([
                setDoc(
                  doc(db, getSlotDocPath(organization, "slot-with-adults")),
                  slotWithAdults
                ),
              ]),
          });

          // The deprecated category already exists in the slot, we should allow it to stay there
          await assertSucceeds(
            setDoc(doc(db, getSlotDocPath(organization, "slot-with-adults")), {
              ...baseSlot,
              categories: [Category.Competitive, DeprecatedCategory.Adults],
            })
          );
          // We're not allowing the creation of new slots with deprecated values
          await assertFails(
            setDoc(doc(db, getSlotDocPath(organization, "new-slot")), {
              ...baseSlot,
              categories: [Category.Competitive, DeprecatedCategory.Adults],
            })
          );
        };
      }
    );
    /**
     * @TODO as firestore.rules don't allow loops or iterations
     * we need to apply this when we agree on maximum number of intervals per slot
     */
    // testWithEmulator(
    //   "should not allow create/update if intervals not valid",
    //   async () => {
    //     const {db} = await getTestEnv({});
    //     const slotRef = doc(db, getSlotDocPath(organization, baseSlot.id));
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

    testWithEmulator("should allow read access to all", async () => {
      const { db, organization } = await getTestEnv({
        auth: false,
        setup: async (db, { organization }) => {
          await setDoc(
            doc(db, getSlotDocPath(organization, baseSlot.id)),
            baseSlot
          );
          // wait for 'slotsByDay' aggregation
          await pRetry(
            async () =>
              (
                await getDoc(
                  doc(db, getSlotsByDayDocPath(organization, monthStr))
                )
              ).exists
          );
        },
      });
      await assertSucceeds(
        getDoc(doc(db, getSlotsByDayDocPath(organization, monthStr)))
      );
    });

    testWithEmulator(
      "should not allow write access (the collection is updated by cloud functions)",
      async () => {
        const { db, organization } = await getTestEnv({});
        await assertFails(
          setDoc(doc(db, getSlotsByDayDocPath(organization, monthStr)), {
            [baseSlot.date]: { [baseSlot.id]: baseSlot },
          })
        );
      }
    );
  });

  describe("Bookings rules", () => {
    testWithEmulator(
      "should allow anybody read access to bookings document",
      async () => {
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            setDoc(
              doc(db, getBookingsDocPath(organization, saul.secretKey)),
              getCustomerBase(saul)
            ),
        });
        await assertSucceeds(
          getDoc(doc(db, getBookingsDocPath(organization, saul.secretKey)))
        );
      }
    );

    testWithEmulator(
      "should not allow anybody write access to bookings document (as it's handled through cloud functions)",
      async () => {
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setDoc(
              doc(db, getBookingsDocPath(organization, saul.secretKey)),
              getCustomerBase(saul)
            ),
        });
        const saulBookingsDoc = doc(
          db,
          getBookingsDocPath(organization, saul.secretKey)
        );
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

    testWithEmulator(
      "should allow anybody to read and write (create/update/delete) booked slots (semi auth is done by possesion of 'secretKey')",
      async () => {
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: async (db, { organization }) =>
            await Promise.all([
              // create test slot (as it's used to check compatibility with booking)
              setDoc(
                doc(db, getSlotDocPath(organization, baseSlot.id)),
                testSlot
              ),
              // create saul's bookings entry (CustomerBase) as it's used to check category
              setDoc(
                doc(db, getBookingsDocPath(organization, saul.secretKey)),
                getCustomerBase(saul)
              ),
            ]),
        });
        const bookedSlotRef = doc(
          db,
          getBookedSlotDocPath(organization, saul.secretKey, baseSlot.id)
        );
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
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            setDoc(
              doc(db, getSlotDocPath(organization, baseSlot.id)),
              testSlot
            ),
        });
        await assertFails(
          setDoc(
            doc(
              db,
              getBookedSlotDocPath(
                organization,
                saul.secretKey,
                "non-existing-slot-id"
              )
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
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            setDoc(
              doc(db, getSlotDocPath(organization, baseSlot.id)),
              testSlot
            ),
        });
        await assertFails(
          setDoc(
            doc(
              db,
              getBookedSlotDocPath(organization, saul.secretKey, baseSlot.id)
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
      "should not allow create/update of invalid booking entry",
      async () => {
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            setDoc(
              doc(db, getSlotDocPath(organization, baseSlot.id)),
              testSlot
            ),
        });
        // check entry <-> subscribed slot `date` mismatch
        await assertFails(
          setDoc(
            doc(
              db,
              getBookedSlotDocPath(organization, saul.secretKey, baseSlot.id)
            ),
            {
              date: DateTime.fromISO(testSlot.date)
                .plus({ days: 1 })
                .toISODate(),
              interval: testIntervals[0],
            }
          )
        );
      }
    );
    testWithEmulator(
      "should not allow customer to subscribe to slot not supporting their category",
      async () => {
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            setDoc(doc(db, getSlotDocPath(organization, baseSlot.id)), {
              ...testSlot,
              // saul is category = "competitive"
              category: [Category.PreCompetitiveAdults],
            }),
        });
        await assertFails(
          setDoc(
            doc(
              db,
              getBookedSlotDocPath(organization, saul.secretKey, baseSlot.id)
            ),
            {
              date: testSlot.date,
              interval: testIntervals[0],
            }
          )
        );
      }
    );
  });

  describe("Customers rules", () => {
    testWithEmulator("should only allow admin access", async () => {
      const { db, organization } = await getTestEnv({
        auth: false,
        setup: (db, { organization }) =>
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), saul),
      });
      // check read
      await assertFails(
        getDoc(doc(db, getCustomerDocPath(organization, saul.id)))
      );
      // check write
      await assertFails(
        setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
          ...saul,
          name: "not-saul",
        })
      );
      // check delete
      await assertFails(
        deleteDoc(doc(db, getCustomerDocPath(organization, saul.id)))
      );
    });

    testWithEmulator("should allow read/write to org admin", async () => {
      const { db, organization } = await getTestEnv({
        setup: (db, { organization }) =>
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), saul),
      });
      // check read
      await assertSucceeds(
        getDoc(doc(db, getCustomerDocPath(organization, saul.id)))
      );
      // check write
      await assertSucceeds(
        setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
          ...saul,
          category: Category.PreCompetitiveAdults,
        })
      );
      // check delete
      await assertSucceeds(
        deleteDoc(doc(db, getCustomerDocPath(organization, saul.id)))
      );
    });

    testWithEmulator(
      "should not allow create/update if required fields (name, surname) not provided",
      async () => {
        const { db, organization } = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, ...noNameSaul } = saul;
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), noNameSaul)
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { surname, ...noSurnameSaul } = saul;
        await assertFails(
          setDoc(
            doc(db, getCustomerDocPath(organization, saul.id)),
            noSurnameSaul
          )
        );
      }
    );
    testWithEmulator(
      "should allow create/update with empty strings as values of optional strings (as is in CustomerForm in production)",
      async () => {
        const { db, organization } = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name, surname, category } = saul;
        const minimalCustomer: Omit<Omit<Customer, "id">, "secretKey"> = {
          // customer form uses `customerTemplate` as initial/fallback values
          // so it's necessary for this to be allowed to submit (with providing basic data ofc)
          ...defaultCustomerFormValues,
          name,
          surname,
          category,
        };
        await assertSucceeds(
          setDoc(
            doc(db, getCustomerDocPath(organization, saul.id)),
            minimalCustomer
          )
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if 'covidCertificateReleaseDate' provided, but not a valid date",
      async () => {
        const { db, organization } = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { covidCertificateReleaseDate, ...noCovidSaul } = saul;
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            covidCertificateReleaseDate: "2022-22-24",
          })
        );
        // should allow if (optional) `covidCertificateReleaseDate` is not provided
        await assertSucceeds(
          setDoc(
            doc(db, getCustomerDocPath(organization, saul.id)),
            noCovidSaul
          )
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if 'certificateExpiration' provided, but not a valid date",
      async () => {
        const { db, organization } = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { certificateExpiration, ...noCertificateSaul } = saul;
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            certificateExpiration: "2022-22-24",
          })
        );
        // should allow if (optional) `certificateExpiration` is not provided
        await assertSucceeds(
          setDoc(
            doc(db, getCustomerDocPath(organization, saul.id)),
            noCertificateSaul
          )
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if birthday provided, but not a valid date",
      async () => {
        const { db, organization } = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { birthday, ...noBirthdaySaul } = saul;
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            birthday: "2022-22-24",
          })
        );
        // should allow if (optional) `birthday` is not provided
        await assertSucceeds(
          setDoc(
            doc(db, getCustomerDocPath(organization, saul.id)),
            noBirthdaySaul
          )
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if phone provided but not valid",
      async () => {
        const { db, organization } = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { phone, ...noPhoneSaul } = saul;
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            phone: "not-a-number-string",
          })
        );
        // number needs to be prepended with "+" or "00"
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            phone: "115566774",
          })
        );
        // should accept only number characters
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            phone: "foobar+123",
          })
        );
        await assertSucceeds(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            phone: "+385996688132",
          })
        );
        // should allow `phone` prepended with "00" instead of "+"
        await assertSucceeds(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            phone: "00385996688132",
          })
        );
        // should allow if (optional) `phone` is not provided
        await assertSucceeds(
          setDoc(
            doc(db, getCustomerDocPath(organization, saul.id)),
            noPhoneSaul
          )
        );
        // check too long and to short phone numbers
        // current min length is 9 (not counting "+" or "00" prefix)
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            phone: "0038599666",
          })
        );
        // current max length is 15 (not counting "+" or "00" prefix)
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            phone: "003859966881231567",
          })
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if email provided but not valid",
      async () => {
        const { db, organization } = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email, ...noEmailSaul } = saul;
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            email: "no-domain-email@",
          })
        );
        // should allow if (optional) `email` is not provided
        await assertSucceeds(
          setDoc(
            doc(db, getCustomerDocPath(organization, saul.id)),
            noEmailSaul
          )
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if invalid category",
      async () => {
        const { db, organization } = await getTestEnv({});
        // check valid `category`
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            category: "not-a-valid-category",
          })
        );
      }
    );
    testWithEmulator(
      'should allow updating customer in "adults" category, but disallow creation of new customers in (non-spacific) "adults" category',
      async () => {
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
              ...saul,
              category: DeprecatedCategory.Adults,
            }),
        });
        // Should allow updating, even though category = "adults"
        await assertSucceeds(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            category: DeprecatedCategory.Adults,
            name: "Jimmy",
          })
        );
        // Should disallow creation of new customers with category "adults"
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, "new-customer")), {
            ...saul,
            category: DeprecatedCategory.Adults,
          })
        );
      }
    );
    testWithEmulator(
      "should not allow create/update if 'covidCertificateSuspended' provided, but not boolean",
      async () => {
        const { db, organization } = await getTestEnv({});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { covidCertificateSuspended, ...noSuspendedSaul } = saul;
        await assertFails(
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), {
            ...saul,
            covidCertificateSuspended: "not-a-boolean",
          })
        );
        await assertSucceeds(
          setDoc(
            doc(db, getCustomerDocPath(organization, saul.id)),
            noSuspendedSaul
          )
        );
      }
    );
    testWithEmulator("should allow `extendedDate` update", async () => {
      const { db, organization } = await getTestEnv({
        setup: (db, { organization }) =>
          setDoc(doc(db, getCustomerDocPath(organization, saul.id)), saul),
      });
      await assertSucceeds(
        setDoc(
          doc(db, getCustomerDocPath(organization, saul.id)),
          {
            extendedDate: "2022-02-01",
          },
          { merge: true }
        )
      );
    });
    /** @TODO Add check for card (subscription) number */
  });

  describe("Attendance rules", () => {
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
        const { db, organization } = await getTestEnv({
          auth: false,
          setup: (db, { organization }) =>
            setDoc(
              doc(db, getAttendanceDocPath(organization, baseSlot.id)),
              testAttendance
            ),
        });
        // check read
        await assertFails(
          getDoc(doc(db, getAttendanceDocPath(organization, baseSlot.id)))
        );
        // check write
        await assertFails(
          setDoc(doc(db, getAttendanceDocPath(organization, baseSlot.id)), {
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
        await assertFails(
          deleteDoc(doc(db, getAttendanceDocPath(organization, baseSlot.id)))
        );
      }
    );

    testWithEmulator(
      "should allow admin read and update access (create/delete are handled through cloud functions)",
      async () => {
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setDoc(
              doc(db, getAttendanceDocPath(organization, baseSlot.id)),
              testAttendance
            ),
        });
        // check read
        await assertSucceeds(
          getDoc(doc(db, getAttendanceDocPath(organization, baseSlot.id)))
        );
        // check update
        await assertSucceeds(
          setDoc(doc(db, getAttendanceDocPath(organization, baseSlot.id)), {
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
            doc(db, getAttendanceDocPath(organization, "new-attendance")),
            testAttendance
          )
        );
        // check delete
        await assertFails(
          deleteDoc(doc(db, getAttendanceDocPath(organization, baseSlot.id)))
        );
      }
    );
    testWithEmulator(
      "should not allow date update (as that is handled through cloud functions on slot update)",
      async () => {
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setDoc(
              doc(db, getAttendanceDocPath(organization, baseSlot.id)),
              testAttendance
            ),
        });
        await assertFails(
          setDoc(doc(db, getAttendanceDocPath(organization, baseSlot.id)), {
            ...testAttendance,
            date: DateTime.fromISO(testAttendance.date)
              .plus({ days: 1 })
              .toISODate(),
          })
        );
        // if date is the same, but is still included in update payload, should allow
        await assertSucceeds(
          setDoc(doc(db, getAttendanceDocPath(organization, baseSlot.id)), {
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
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setDoc(doc(db, getEmailProcessDocPath(organization, "mail-id")), {
              message: { html: "Hello world", subject: "Subject" },
              to: "ikusteu@gmail.com",
            }),
        });
        // check read
        await assertFails(
          getDoc(doc(db, getEmailProcessDocPath(organization, "mail-id")))
        );
        // check write
        await assertFails(
          setDoc(doc(db, getEmailProcessDocPath(organization, "new-mail-id")), {
            message: {
              html: "Hello from the other side",
              subject: "Subject 2",
            },
            to: "ikusteu@gmail.com",
          })
        );
        // check delete
        await assertFails(
          deleteDoc(doc(db, getEmailProcessDocPath(organization, "mail-id")))
        );
      }
    );
  });

  describe("Secrets rules", () => {
    testWithEmulator(
      "should not allow anybody read/write access to 'secrets', it should only be written to from firebase console",
      async () => {
        const { db } = await getTestEnv({
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
