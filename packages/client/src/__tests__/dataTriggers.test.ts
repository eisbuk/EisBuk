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
} from "@eisbuk/shared";

import { saul, walt } from "@eisbuk/testing/customers";
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

const testMonth = testDate.substring(0, 7);

describe("Cloud functions -> Data triggers ->", () => {
  describe("createAttendanceForBooking", () => {
    const baseAttendance = {
      date: baseSlot.date,
      attendances: {
        ["dummy-customer"]: {
          bookedInterval: Object.keys(baseSlot.intervals)[0],
          attendedInterval: Object.keys(baseSlot.intervals)[1],
        },
      },
    };

    const bookedSlot = {
      data: baseSlot.date,
      interval: Object.keys(baseSlot.intervals)[0],
    };

    const attendanceWithTestBooking = {
      ...baseAttendance,
      attendances: {
        ...baseAttendance.attendances,
        [saul.id]: {
          bookedInterval: bookedSlot.interval,
          attendedInterval: bookedSlot.interval,
        },
      },
    };

    test.skip(
      // FIXME - this test was flapping too much, so we stop running it
      "should create attendance entry for booking and not overwrite existing data in slot",
      async () => {
        const { organization } = await setUpOrganization();
        await Promise.all([
          // set up Saul's bookings entry
          adminDb
            .doc(getBookingsDocPath(organization, saul.secretKey))
            .set(sanitizeCustomer(saul)),
          // set up dummy data in the base slot, not to be overwritten by Saul's attendance
          adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .set(baseAttendance),
        ]);
        // add new booking trying to trigger attendance entry
        await adminDb
          .doc(getBookedSlotDocPath(organization, saul.secretKey, baseSlot.id))
          .set(bookedSlot);
        // check proper updates triggerd by write to bookings
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .get();
          expect(snap.data()).toEqual(attendanceWithTestBooking);
        });
        // deleting the booking should remove it from attendance doc
        await adminDb
          .doc(getBookedSlotDocPath(organization, saul.secretKey, baseSlot.id))
          .delete();
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getAttendanceDocPath(organization, baseSlot.id))
            .get();
          // check that only the test customer's attendance's deleted, but not the rest of the data
          expect(snap.data()).toEqual(baseAttendance);
        });
      },
      { timeout: 20000 }
    );
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

        await Promise.all([
          await waitFor(async () => {
            const snap = await adminDb
              .doc(getCustomerDocPath(organization, saul.id))
              .get();
            expect(snap.data()).toEqual(saul);
          }),
        ]);

        const bookedSlotThisMonthIce = {
          date: slotThisMonthIce.date,
          interval: Object.keys(slotThisMonthIce.intervals)[0],
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

        // The booked slot should be created in customer's bookings
        await waitFor(async () => {
          const snap = await adminDb
            .doc(
              getBookedSlotDocPath(
                organization,
                saul.secretKey,
                `${bookedSlotThisMonthIce.date}-9`
              )
            )
            .get();

          expect(snap.data()).toEqual(bookedSlotThisMonthIce);
        });

        // The customer should include bookingsStats
        await waitFor(async () => {
          const snap = await adminDb
            .doc(getCustomerDocPath(organization, saul.id))
            .get();

          expect(snap.data()).toMatchObject({
            ...saul,
            bookingStats: {
              thisMonthIce: 1,
              thisMonthOffIce: 1,
              nextMonthIce: 1,
              nextMonthOffIce: 1,
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
              thisMonthIce: 0,
              thisMonthOffIce: 1,
              nextMonthIce: 1,
              nextMonthOffIce: 1,
            },
          });
        });
      }
    );
  });
});
