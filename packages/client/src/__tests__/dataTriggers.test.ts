/**
 * @vitest-environment node
 */

import { v4 as uuid } from "uuid";
import { describe, expect, test } from "vitest";

import {
  Collection,
  Category,
  luxon2ISODate,
  SlotType,
  OrganizationData,
  sanitizeCustomer,
  defaultEmailTemplates as emailTemplates,
  defaultSMSTemplates as smsTemplates,
  CustomerBookingEntry,
  CustomerAttendance,
  OrgSubCollection,
  SlotInterval,
  BookingSubCollection,
} from "@eisbuk/shared";

import { gus, saul, walt } from "@eisbuk/testing/customers";
import { baseSlot, createIntervals } from "@eisbuk/testing/slots";
import { testDate, testDateLuxon } from "@eisbuk/testing/date";

import { adminDb } from "@/__testSetup__/firestoreSetup";
import { setUpOrganization } from "@/__testSetup__/node";

import {
  getAttendanceDocPath,
  getAttendedSlotDocPath,
  getBookedSlotDocPath,
  getBookingsDocPath,
  getCustomerDocPath,
  getSlotDocPath,
  getSlotsByDayDocPath,
} from "@/utils/firestore";

import { waitFor } from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { DateTime } from "luxon";
import _ from "lodash";

const testMonth = testDate.substring(0, 7);

describe("Cloud functions -> Data triggers ->", () => {
  describe("createAttendanceForBooking", () => {
    /** Test params of each of the booking -> attendance data trigger table tests */
    interface BookingAttendanceTestCase {
      /** Test name */
      name: string;

      /**
       * Initial booking to be set up at the beginning of the test.
       *
       * **This will be stored as a `bookedSlots` document for saul**
       *
       * _If testing for create, this will be null._
       */
      initialBooking: CustomerBookingEntry | null;
      /**
       * Initial attendance to be set up at the beginning of the test.
       *
       * **This will be stored in the `attendance` document for the slot, as saul's attendance and doesn't
       * include the base attendance (which will always be set up).**
       *
       * _If testing for create, this will be null._
       */
      initialAttendance: CustomerAttendance | null;
      /**
       * Update to be applied to the booking document.
       *
       * This can either be:
       * - bookings doc - the updated document (this should be thw whole document as the update is made as-is, `{merge: false}`)
       * - `null` - in this case, the document will be deleted for test case
       */
      update: Partial<CustomerBookingEntry> | null;
      /**
       * This is the attendance (for saul) expected at the end of the test.
       *
       * **This is saul's portion of the slot attendance only. The rest of the base attenadance will always be there
       * and will expected to be there in each test case.**
       */
      wantAttendance: CustomerAttendance | null;
    }

    // This structure is used as a base setup of the attendance document for the slot
    // we're using in tests. It's here to ensure no other data (than the data in focus) should be touched.
    const baseAttendance = {
      date: baseSlot.date,
      attendances: {
        ["dummy-customer"]: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[1],
        },
      },
    };

    const runTableTests = (testCases: BookingAttendanceTestCase[]) => {
      testCases.forEach(
        ({
          name,
          initialBooking,
          initialAttendance,
          update,
          wantAttendance,
        }) => {
          testWithEmulator(name, async () => {
            const { organization } = await setUpOrganization();

            await Promise.all([
              // set up Saul's bookings entry
              adminDb
                .doc(getBookingsDocPath(organization, saul.secretKey))
                .set(sanitizeCustomer(saul)),
              // set up base data in the attendance document
              adminDb
                .doc(getAttendanceDocPath(organization, baseSlot.id))
                .set(baseAttendance),
            ]);

            if (initialBooking) {
              await adminDb
                .doc(
                  getBookedSlotDocPath(
                    organization,
                    saul.secretKey,
                    baseSlot.id
                  )
                )
                .set(initialBooking);

              await waitFor(async () => {
                const snap = await adminDb
                  .doc(getAttendanceDocPath(organization, baseSlot.id))
                  .get();
                const wantAttendance = _.cloneDeep(baseAttendance);
                wantAttendance.attendances[saul.id] = initialAttendance;
                expect(snap.data()).toEqual(wantAttendance);
              });
            }

            // update (or delete) the booked slot
            const bookedSlotRef = adminDb.doc(
              getBookedSlotDocPath(organization, saul.secretKey, baseSlot.id)
            );
            if (update) {
              await bookedSlotRef.set(update);
            } else {
              await bookedSlotRef.delete();
            }

            // check proper updates triggerd by write to bookings
            const wantAttendanceFinal = _.cloneDeep(baseAttendance);
            if (wantAttendance) {
              wantAttendanceFinal.attendances[saul.id] = wantAttendance;
            }

            await waitFor(async () => {
              const snap = await adminDb
                .doc(getAttendanceDocPath(organization, baseSlot.id))
                .get();
              expect(snap.data()).toEqual(wantAttendanceFinal);
            });
          });
        }
      );
    };

    runTableTests([
      {
        name: "create booking: interval only",
        initialAttendance: null,
        initialBooking: null,
        update: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[0],
        },
        wantAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
        },
      },

      {
        name: "create booking: interval with notes",
        initialAttendance: null,
        initialBooking: null,
        update: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[0],
          bookingNotes: "This is a booking note",
        },
        wantAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
          bookingNotes: "This is a booking note",
        },
      },

      {
        name: "update booking: interval only",
        initialBooking: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[0],
        },
        initialAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
        },
        update: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[1],
        },
        wantAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[1],
          attendedInterval: Object.keys(baseSlot.intervals)[1],
        },
      },

      {
        name: "update booking: interval with notes",
        initialBooking: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[0],
        },
        initialAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
        },
        update: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[1],
          bookingNotes: "This is a booking note",
        },
        wantAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[1],
          attendedInterval: Object.keys(baseSlot.intervals)[1],
          bookingNotes: "This is a booking note",
        },
      },

      {
        name: "update booking: notes only",
        initialBooking: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[0],
        },
        initialAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
        },
        update: {
          interval: Object.keys(baseSlot.intervals)[0],
          bookingNotes: "This is a booking note",
        },
        wantAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
          bookingNotes: "This is a booking note",
        },
      },

      {
        name: "remove booking notes",
        initialBooking: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[0],
          bookingNotes: "This is a booking note",
        },
        initialAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
          bookingNotes: "This is a booking note",
        },
        update: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[0],
        },
        wantAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
        },
      },

      {
        name: "delete booking",
        initialBooking: {
          date: baseSlot.date,
          interval: Object.keys(baseSlot.intervals)[0],
        },
        initialAttendance: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[0],
        },
        update: null, // null = delete the slot!
        wantAttendance: null,
      },
    ]);
  });

  describe("countSlotsBookings", () => {
    test("should increment/decrement numBookings field in slotsByDay for the given slot", async () => {
      const { organization } = await setUpOrganization();

      const slotDate = "2022-01-01";
      const slot = {
        ...baseSlot,
        id: "slot-1",
        date: slotDate,
        intervals: {
          "08:00-09:00": {
            startTime: "08:00",
            endTime: "09:00",
          } as SlotInterval,
        },
      };

      const orgRef = adminDb
        .collection(Collection.Organizations)
        .doc(organization);
      const bookingCountsDocRef = orgRef
        .collection(OrgSubCollection.SlotBookingsCounts)
        .doc(slotDate.substring(0, 7));
      const saulBookings = orgRef
        .collection(OrgSubCollection.Bookings)
        .doc(saul.secretKey);
      const gusBookings = orgRef
        .collection(OrgSubCollection.Bookings)
        .doc(gus.secretKey);

      // Add a slot and customers to work with
      await Promise.all([
        orgRef.collection(OrgSubCollection.Slots).doc(slot.id).set(slot),
        orgRef.collection(OrgSubCollection.Customers).doc(saul.id).set(saul),
        orgRef.collection(OrgSubCollection.Customers).doc(gus.id).set(gus),
      ]);

      // Wait for the data triggers to run
      await Promise.all([
        waitFor(async () =>
          expect((await saulBookings.get()).exists).toEqual(true)
        ),
        waitFor(async () =>
          expect((await gusBookings.get()).exists).toEqual(true)
        ),
      ]);

      // Book the slot for Saul
      await saulBookings
        .collection(BookingSubCollection.BookedSlots)
        .doc(slot.id)
        .set({
          date: slotDate,
          interval: "08:00-09:00",
        });

      // Should account for the booking
      await waitFor(async () => {
        const snap = await bookingCountsDocRef.get();
        expect(snap.data()![slot.id]).toEqual(1);
      });

      // Book the slot for Gus
      await gusBookings
        .collection(BookingSubCollection.BookedSlots)
        .doc(slot.id)
        .set({
          date: slotDate,
          interval: "08:00-09:00",
        });

      // Should account for the booking
      await waitFor(async () => {
        const snap = await bookingCountsDocRef.get();
        expect(snap.data()![slot.id]).toEqual(2);
      });

      // Unbook the slot for Saul
      await saulBookings
        .collection(BookingSubCollection.BookedSlots)
        .doc(slot.id)
        .delete();

      // The total shuld reflect the deletion
      await waitFor(async () => {
        const snap = await bookingCountsDocRef.get();
        expect(snap.data()![slot.id]).toEqual(1);
      });
    });
  });

  describe("aggreagateSlots", () => {
    // prepare new slot test data for this block's tests
    const dayAfter = luxon2ISODate(testDateLuxon.plus({ days: 1 }));
    const newSlotId = "new-slot";
    const newSlot = { ...baseSlot, date: dayAfter, id: newSlotId };

    test.skip(// FIXME - this test was flapping too much, so we stop running it
    "should create slotsByDay entry for slot on create", async () => {
      const { organization } = await setUpOrganization();
      // add new slot to trigger slot aggregation
      await adminDb
        .doc(getSlotDocPath(organization, baseSlot.id))
        .set(baseSlot);
      // check that the slot has been aggregated to `slotsByDay`
      const expectedSlotsByDay = { [testDate]: { [baseSlot.id]: baseSlot } };
      const slotsByDayEntry = await waitFor(async () => {
        const snap = await adminDb
          .doc(getSlotsByDayDocPath(organization, testMonth))
          .get();
        expect(snap.data()).toEqual(expectedSlotsByDay);
        return snap.data();
      });
      // test adding another slot on different day of the same month
      await adminDb.doc(getSlotDocPath(organization, newSlotId)).set(newSlot);
      await waitFor(async () => {
        const snap = await adminDb
          .doc(getSlotsByDayDocPath(organization, testMonth))
          .get();
        expect(snap.data()).toEqual({
          ...slotsByDayEntry,
          [dayAfter]: { [newSlotId]: newSlot },
        });
      });
    });

    test.skip(// FIXME - this test was flapping too much, so we stop running it
    "should update aggregated slotsByDay on slot update", async () => {
      // set up test state
      const { organization } = await setUpOrganization();
      const slotRef = adminDb.doc(getSlotDocPath(organization, baseSlot.id));
      await slotRef.set(baseSlot);
      await waitFor(async () => {
        const snap = await adminDb
          .doc(getSlotsByDayDocPath(organization, testMonth))
          .get();
        expect(snap.exists).toEqual(true);
        expect(Boolean(snap.data()![testDate])).toEqual(true);
      });
      // test slot updating
      const newIntervals = createIntervals(18);
      const updatedSlot = {
        ...baseSlot,
        intervals: newIntervals,
        type: SlotType.OffIce,
      };
      slotRef.set(updatedSlot);
      const expectedSlotsByDay = {
        [testDate]: { [baseSlot.id]: updatedSlot },
      };
      await waitFor(async () => {
        const snap = await adminDb
          .doc(getSlotsByDayDocPath(organization, testMonth))
          .get();
        expect(snap.data()).toEqual(expectedSlotsByDay);
      });
    });

    testWithEmulator(
      "should remove slot from slotsByDay on slot delete",
      async () => {
        // set up test state
        const { organization } = await setUpOrganization();
        await adminDb
          .doc(getSlotDocPath(organization, baseSlot.id))
          .set(baseSlot);
        const newSlotRef = adminDb.doc(
          getSlotDocPath(organization, baseSlot.id)
        );
        await newSlotRef.set(newSlot);
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getSlotsByDayDocPath(organization, testMonth))
            .get();
          // wait until both slots are aggregated
          const data = snap.data()!;
          expect(Boolean(data[testDate] && data[dayAfter])).toEqual(true);
        });
        // test removing of the additional slot
        await newSlotRef.delete();
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getSlotsByDayDocPath(organization, testMonth))
            .get();
          expect(snap.exists).toEqual(true);
          expect(Boolean(snap.data()![testDate][newSlotId])).toEqual(false);
        });
      }
    );
  });

  describe("createAttendanceForSlot", () => {
    testWithEmulator(
      "should create attendance entry for slot (containing only the date) in 'attendance' collection, only on create slot (not on update)",
      async () => {
        const { organization } = await setUpOrganization();
        // add new slot to trigger adding attendance for given slot
        const slotRef = adminDb.doc(getSlotDocPath(organization, baseSlot.id));
        await slotRef.set(baseSlot);
        // check proper updates triggerd by write to slot
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .get();
          expect(snap.data()).toEqual({
            date: baseSlot.date,
            attendances: {},
          });
        });
        // we're manually deleting attendance to test that it won't get created on slot update
        // the attendance entry for slot shouldn't be edited manually in production
        const attendanceDocRef = adminDb.doc(
          getAttendanceDocPath(organization, baseSlot.id)
        );
        await attendanceDocRef.delete();
        // wait for attendance entry to be deleted
        // update the slot and expect new slot attendance entry not to be created
        await slotRef.set({
          ...baseSlot,
          intervals: {},
          categories: [Category.PreCompetitiveAdults],
        });
        // check the no new entry for slot attendance was created (on update)
        const slotAttendance = await attendanceDocRef.get();
        expect(slotAttendance.exists).toEqual(false);
      }
    );

    testWithEmulator(
      "should delete attendance entry for slot when the slot is deleted",
      async () => {
        // we're following the same setup from the test before
        const { organization } = await setUpOrganization();
        const slotRef = adminDb.doc(getSlotDocPath(organization, baseSlot.id));
        await slotRef.set(baseSlot);
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .get();
          expect(snap.exists).toEqual(true);
        });
        // delete the slot entry
        await slotRef.delete();
        // expect attendance to be deleted too
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .get();
          expect(snap.exists).toEqual(false);
        });
      }
    );

    testWithEmulator(
      "should delete attendance entry for slot when the slot is deleted",
      async () => {
        const { organization } = await setUpOrganization();
        // we're following the same setup from the test before
        const slotRef = adminDb.doc(getSlotDocPath(organization, baseSlot.id));
        await slotRef.set(baseSlot);
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .get();
          expect(snap.exists).toEqual(true);
        });
        // delete the slot entry
        await slotRef.delete();
        // expect attendance to be deleted too
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .get();
          expect(snap.exists).toEqual(false);
        });
      }
    );
  });

  describe("registerCreatedOrgSecret", () => {
    testWithEmulator(
      "should update 'existingSecrets' in organization data document when secrets get added or removed",
      async () => {
        const { organization } = await setUpOrganization({
          doLogin: true,
          setSecrets: false,
        });
        const organizationPath = `${Collection.Organizations}/${organization}`;
        const secretsPath = `${Collection.Secrets}/${organization}`;
        // add new secret to trigger registering
        const orgSecretsRef = adminDb.doc(secretsPath);
        await orgSecretsRef.set({ testSecret: "abc123" });
        // check proper updates triggerd by write to secrets
        await waitFor(async () => {
          const snap = await adminDb.doc(organizationPath).get();
          expect(snap.data()!.existingSecrets).toEqual(["testSecret"]);
        });

        // add another secret
        await orgSecretsRef.set({ anotherSecret: "abc234" }, { merge: true });
        await waitFor(async () => {
          const snap = await adminDb.doc(organizationPath).get();
          expect(snap.data()!.existingSecrets).toEqual([
            "testSecret",
            "anotherSecret",
          ]);
        });

        // removing one secret should remove it from array (without removing other secrets)
        await orgSecretsRef.set({ anotherSecret: "abc234" });
        await waitFor(async () => {
          const snap = await adminDb.doc(organizationPath).get();
          expect(snap.data()!.existingSecrets).toEqual(["anotherSecret"]);
        });
      }
    );

    testWithEmulator(
      "updates 'smtpConfigured' with respect to smtp config being present in organization data",
      async () => {
        const { organization } = await setUpOrganization({
          doLogin: true,
          setSecrets: false,
        });
        const organizationPath = `${Collection.Organizations}/${organization}`;
        const secretsPath = `${Collection.Secrets}/${organization}`;
        // add new secret to trigger registering
        const orgSecretsRef = adminDb.doc(secretsPath);

        await orgSecretsRef.set({
          smtpHost: "localhost",
        });

        // check proper updates triggerd by write to secrets
        await waitFor(async () => {
          const snap = await adminDb.doc(organizationPath).get();
          const data = snap.data() as OrganizationData;
          expect(data.existingSecrets).toEqual(
            expect.arrayContaining(["smtpHost"])
          );
          expect(data.smtpConfigured).toBeFalsy();
        });

        const secrets = {
          smtpHost: "localhost",
          smtpPort: 4000,
          smtpUser: "user",
          smtpPass: "password",
        };

        await orgSecretsRef.set(secrets, { merge: true });
        // check proper updates triggerd by write to secrets
        await waitFor(async () => {
          const snap = await adminDb.doc(organizationPath).get();
          const data = snap.data() as OrganizationData;
          expect(
            Object.keys(secrets).every((key) =>
              data.existingSecrets!.includes(key)
            )
          ).toEqual(true);
          expect(data.smtpConfigured).toEqual(true);
        });

        const notAllSecrets = {
          smtpHost: "localhost",
          smtpPort: 4000,
          smtpUser: "user",
        };
        await orgSecretsRef.set(notAllSecrets);
        // check proper updates triggerd by write to secrets
        await waitFor(async () => {
          const snap = await adminDb.doc(organizationPath).get();
          expect(snap.data()!.smtpConfigured).toEqual(false);
        });
      }
    );
  });

  describe("createPublicOrgInfo", () => {
    testWithEmulator(
      "should update/create general info in organization data to publicOrgInfo collection when organization data is updated",
      async () => {
        const organizationData: OrganizationData = {
          displayName: "Los Pollos Hermanos",
          location: "Albuquerque",
          admins: ["Gus Fring"],
          emailFrom: "gus@lospollos.hermanos",
          emailTemplates,
          emailNameFrom: "Gus",
          smsFrom: "Gus",
          smsTemplates,
          existingSecrets: ["authToken", "exampleSecret"],
          emailBcc: "gus@lospollos.hermanos",
          privacyPolicy: {
            prompt: "Do you accept",
            learnMoreLabel: "Take the blue pill",
            acceptLabel: "Take the red pill",
            policy: "Wake up Neo, the Matrix has you!",
          },
        };

        // use random string for organization to ensure test is ran in pristine environment each time
        // but avoid `setUpOrganization()` as we want to set up organization ourselves
        const organization = uuid();
        const { displayName, location, emailFrom, privacyPolicy } =
          organizationData;

        const publicOrgPath = `${Collection.PublicOrgInfo}/${organization}`;
        const orgPath = `${Collection.Organizations}/${organization}`;

        // check for non existence of publicOrgInfo before creating a new organization
        const publicOrgSnap = await adminDb.doc(publicOrgPath).get();
        expect(publicOrgSnap.exists).toBeFalsy();

        // create new organization
        const orgRef = adminDb.doc(orgPath);
        await orgRef.set(organizationData);

        // check for publicOrgInfo
        await waitFor(async () => {
          const snap = await adminDb.doc(publicOrgPath).get();
          expect(snap.data()).toEqual({
            displayName,
            location,
            emailFrom,
            privacyPolicy,
          });
        });

        // test non existence of publicOrgInfo after organization is deleted
        await orgRef.delete();
        await waitFor(async () => {
          const snap = await adminDb.doc(publicOrgPath).get();
          expect(snap.exists).toEqual(false);
        });
      }
    );
  });

  describe("createAttendedSlotsForAttendance", () => {
    testWithEmulator(
      "should update the document in attendedSlots with respect to customer's attendance on slot",
      async () => {
        const { organization } = await setUpOrganization();
        // Create customer and slot
        await Promise.all([
          adminDb.doc(getSlotDocPath(organization, baseSlot.id)).set(baseSlot),
          adminDb.doc(getCustomerDocPath(organization, saul.id)).set(saul),
        ]);

        // Wait for the attendance document to be created, as well
        // as customer's bookings document
        await Promise.all([
          waitFor(async () => {
            const snap = await adminDb
              .doc(getAttendanceDocPath(organization, baseSlot.id))
              .get();
            expect(snap.exists);
          }),
          await waitFor(async () => {
            const snap = await adminDb
              .doc(getBookingsDocPath(organization, saul.secretKey))
              .get();
            expect(snap.exists);
          }),
        ]);

        // Mark customer as present
        await adminDb.doc(getAttendanceDocPath(organization, baseSlot.id)).set({
          date: baseSlot.date,
          attendances: {
            [saul.id]: {
              attendedInterval: Object.keys(baseSlot.intervals)[0],
              bookedInterval: null,
            },
          },
        });
        // The attended slot should be created in customer's bookings
        await waitFor(async () => {
          const snap = await adminDb
            .doc(
              getAttendedSlotDocPath(organization, saul.secretKey, baseSlot.id)
            )
            .get();
          expect(snap.data()).toEqual({
            date: baseSlot.date,
            interval: Object.keys(baseSlot.intervals)[0],
          });
        });

        // Update customer's attended interval for the slot
        await adminDb.doc(getAttendanceDocPath(organization, baseSlot.id)).set({
          date: baseSlot.date,
          attendances: {
            [saul.id]: {
              attendedInterval: Object.keys(baseSlot.intervals)[1],
              bookedInterval: null,
            },
          },
        });
        // The attended slot should be updated with the new interval
        await waitFor(async () => {
          const attendedSlotDoc = await adminDb
            .doc(
              getAttendedSlotDocPath(organization, saul.secretKey, baseSlot.id)
            )
            .get();
          expect(attendedSlotDoc.data()).toEqual({
            date: baseSlot.date,
            interval: Object.keys(baseSlot.intervals)[1],
          });
        });

        // Mark customer as absent
        await adminDb.doc(getAttendanceDocPath(organization, baseSlot.id)).set({
          date: baseSlot.date,
          attendances: {},
        });
        // The attended slot document should be deleted
        await waitFor(async () => {
          const snap = await adminDb
            .doc(
              getAttendedSlotDocPath(organization, saul.secretKey, baseSlot.id)
            )
            .get();
          expect(snap.exists).toEqual(false);
        });
      }
    );

    testWithEmulator(
      "should not create document in attendedSlots collection if customer had booked the slot",
      async () => {
        // We're testing that the data trigger event shouldn't create an attended slot for customer with booking.
        // This is a bit of a tricky one as no update will happen immediately after the attendance has been updated
        // and we don't want to use flaky methods like waiting for a hardcoded amount of time to check for the update (not having happened).
        //
        // Therefore, we're testing for two customers: one with booking (test variable), and one without booking (controlled variable),
        // applying attendance update to the test customer, after that, applying the attendance update to the controlled customer,
        // waiting for controlled customer's attended slot to be crated, and then checking that the test customer's attended slot hasn't been created.

        const { organization } = await setUpOrganization();

        const testCustomer = saul;
        const controlledCustomer = walt;

        // Create the slot and customers entries
        await Promise.all([
          adminDb.doc(getSlotDocPath(organization, baseSlot.id)).set(baseSlot),
          adminDb
            .doc(getCustomerDocPath(organization, testCustomer.id))
            .set(testCustomer),
          adminDb
            .doc(getCustomerDocPath(organization, controlledCustomer.id))
            .set(controlledCustomer),
        ]);

        // Wait for the attendance document to be created, as well
        // as bookings document for each respective customer
        await Promise.all([
          waitFor(async () => {
            const snap = await adminDb
              .doc(getAttendanceDocPath(organization, baseSlot.id))
              .get();
            expect(snap.exists).toEqual(true);
          }),
          waitFor(async () => {
            const snap = await adminDb
              .doc(getBookingsDocPath(organization, testCustomer.secretKey))
              .get();
            expect(snap.exists).toEqual(true);
          }),
          waitFor(async () => {
            const snap = await adminDb
              .doc(
                getBookingsDocPath(organization, controlledCustomer.secretKey)
              )
              .get();
            expect(snap.exists).toEqual(true);
          }),
        ]);

        // Book slot for test customer
        await adminDb
          .doc(
            getBookedSlotDocPath(
              organization,
              testCustomer.secretKey,
              baseSlot.id
            )
          )
          .set({
            date: baseSlot.date,
            interval: Object.keys(baseSlot.intervals)[0],
          });

        // Wait for the update to appear in attendance document
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .get();
          expect(snap.data()).toEqual({
            date: baseSlot.date,
            attendances: {
              [testCustomer.id]: {
                bookedInterval: Object.keys(baseSlot.intervals)[0],
                attendedInterval: Object.keys(baseSlot.intervals)[0],
              },
            },
          });
        });

        // Mark controlled customer as present (without having booked)
        adminDb.doc(getAttendanceDocPath(organization, baseSlot.id)).set({
          date: baseSlot.date,
          attendances: {
            [controlledCustomer.id]: {
              bookedInterval: null,
              attendedInterval: Object.keys(baseSlot.intervals)[0],
            },
            [testCustomer.id]: {
              bookedInterval: Object.keys(baseSlot.intervals)[0],
              attendedInterval: Object.keys(baseSlot.intervals)[0],
            },
          },
        });

        // Wait for controlled customer's attended slot document to be created
        await waitFor(async () => {
          const snap = await adminDb
            .doc(
              getAttendedSlotDocPath(
                organization,
                controlledCustomer.secretKey,
                baseSlot.id
              )
            )
            .get();
          expect(snap.exists).toEqual(true);
        });

        // Assert that test customer's attended slot document hasn't been created (which, if the behaviour is faulty, it would have been by now)
        await waitFor(async () => {
          const snap = await adminDb
            .doc(
              getAttendedSlotDocPath(
                organization,
                testCustomer.secretKey,
                baseSlot.id
              )
            )
            .get();
          expect(snap.exists).toEqual(false);
        });
      }
    );
  });
  describe("createCustomerStats", () => {
    testWithEmulator(
      "should update the customer doc with bookingStats with respect to customer's bookedSlots",
      async () => {
        const { organization } = await setUpOrganization();
        const dateThisMonth = DateTime.now().toISODate();
        const dateNextMonth = DateTime.now().plus({ month: 1 }).toISODate();
        const slotThisMonthIce = {
          ...baseSlot,
          date: dateThisMonth,
          type: SlotType.Ice,
        };
        const slotNextMonthIce = {
          ...baseSlot,
          date: dateNextMonth,
          type: SlotType.Ice,
        };
        const slotThisMonthOffIce = {
          ...baseSlot,
          date: dateThisMonth,
          type: SlotType.OffIce,
        };
        const slotNextMonthOffIce = {
          ...baseSlot,
          date: dateNextMonth,
          type: SlotType.OffIce,
        };
        // Create customer and slot
        await Promise.all([
          adminDb
            .doc(getSlotDocPath(organization, `${dateThisMonth}-9`))
            .set(slotThisMonthIce),
          adminDb
            .doc(getSlotDocPath(organization, `${dateNextMonth}-9`))
            .set(slotNextMonthIce),
          adminDb
            .doc(getSlotDocPath(organization, `${dateThisMonth}-10`))
            .set(slotThisMonthOffIce),
          adminDb
            .doc(getSlotDocPath(organization, `${dateNextMonth}-10`))
            .set(slotNextMonthOffIce),
          adminDb.doc(getCustomerDocPath(organization, saul.id)).set(saul),
        ]);

        const bookedSlotThisMonthIce = {
          date: slotThisMonthIce.date,
          interval: Object.keys(slotNextMonthIce.intervals)[0],
        };
        const bookedSlotNextMonthIce = {
          date: slotNextMonthIce.date,
          interval: Object.keys(slotNextMonthIce.intervals)[0],
        };

        const bookedSlotThisMonthOffIce = {
          date: slotThisMonthOffIce.date,
          interval: Object.keys(slotThisMonthOffIce.intervals)[0],
        };
        const bookedSlotNextMonthOffIce = {
          date: slotNextMonthOffIce.date,
          interval: Object.keys(slotNextMonthOffIce.intervals)[0],
        };

        // book slots
        await Promise.all([
          // two slots this month ice
          await adminDb
            .doc(
              getBookedSlotDocPath(
                organization,
                saul.secretKey,
                `${bookedSlotThisMonthIce.date}-9`
              )
            )
            .set(bookedSlotThisMonthIce),
          await adminDb
            .doc(
              getBookedSlotDocPath(
                organization,
                saul.secretKey,
                `${bookedSlotNextMonthIce.date}-9`
              )
            )
            .set(bookedSlotNextMonthIce),
          await adminDb
            .doc(
              getBookedSlotDocPath(
                organization,
                saul.secretKey,
                `${bookedSlotThisMonthOffIce.date}-10`
              )
            )
            .set(bookedSlotThisMonthOffIce),
          await adminDb
            .doc(
              getBookedSlotDocPath(
                organization,
                saul.secretKey,
                `${bookedSlotNextMonthOffIce.date}-10`
              )
            )
            .set(bookedSlotNextMonthOffIce),
        ]);
        const thisMonthStr = dateThisMonth.substring(0, 7);
        const nextMonthStr = dateNextMonth.substring(0, 7);

        // The customer should include bookingsStats
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getCustomerDocPath(organization, saul.id))
            .get();

          expect(snap.data()).toMatchObject({
            ...saul,
            bookingStats: {
              [thisMonthStr]: {
                ice: 1,
                "off-ice": 1,
              },
              [nextMonthStr]: {
                ice: 1,
                "off-ice": 1,
              },
            },
          });
        });

        // cancel a slot
        await adminDb
          .doc(
            getBookedSlotDocPath(
              organization,
              saul.secretKey,
              `${bookedSlotThisMonthIce.date}-9`
            )
          )
          .delete();

        // The customer should include bookingsStats
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getCustomerDocPath(organization, saul.id))
            .get();

          expect(snap.data()).toMatchObject({
            ...saul,
            bookingStats: {
              [thisMonthStr]: {
                ice: 0,
                "off-ice": 1,
              },
              [nextMonthStr]: {
                ice: 1,
                "off-ice": 1,
              },
            },
          });
        });
      }
    );
  });
});
