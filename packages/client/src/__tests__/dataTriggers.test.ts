/**
 * @jest-environment node
 */
import { v4 as uuid } from "uuid";

import {
  Collection,
  Category,
  luxon2ISODate,
  SlotType,
  OrganizationData,
  getCustomerBase,
} from "@eisbuk/shared";

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

import { waitForCondition } from "@/__testUtils__/helpers";
import { testWithEmulator } from "@/__testUtils__/envUtils";

import {
  testBooking,
  attendanceWithTestCustomer,
  baseAttendance,
  emptyAttendance,
  organization as organizationData,
  intervals,
} from "@/__testData__/dataTriggers";
import { saul, walt } from "@/__testData__/customers";
import { baseSlot, createIntervals } from "@/__testData__/slots";
import { testDate, testDateLuxon } from "@/__testData__/date";

const slotId = baseSlot.id;
const customerId = saul.id;
const secretKey = saul.secretKey;
const customerBooking = getCustomerBase(saul);
const testMonth = testDate.substring(0, 7);

describe("Cloud functions -> Data triggers ->", () => {
  describe("createAttendanceForBooking", () => {
    testWithEmulator(
      "should create attendance entry for booking and not overwrite existing data in slot",
      async () => {
        const { organization } = await setUpOrganization();
        // set up booking entry for customers booking info
        await adminDb
          .doc(getBookingsDocPath(organization, secretKey))
          .set(customerBooking);
        // set up dummy data in the same slot, not to be overwritten
        await adminDb
          .doc(getAttendanceDocPath(organization, slotId))
          .set(baseAttendance);
        // add new booking trying to trigger attendance entry
        const testBookingDocRef = adminDb.doc(
          getBookedSlotDocPath(organization, secretKey, slotId)
        );
        await testBookingDocRef.set(testBooking);
        // check proper updates triggerd by write to bookings
        const docRes = await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => Boolean(data && data.attendances[customerId]),
        });
        expect(docRes).toEqual(attendanceWithTestCustomer);
        // test customer's attendnace being removed from slot's attendnace
        await testBookingDocRef.delete();
        const docRes2 = await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => Boolean(data && !data.attendances[customerId]),
        });
        // check that only the test customer's attendance's deleted, but not the rest of the data
        expect(docRes2).toEqual(baseAttendance);
      }
    );
  });

  describe("aggreagateSlots", () => {
    // prepare new slot test data for this block's tests
    const dayAfter = luxon2ISODate(testDateLuxon.plus({ days: 1 }));
    const newSlotId = "new-slot";
    const newSlot = { ...baseSlot, date: dayAfter, id: newSlotId };

    testWithEmulator(
      "should create slotsByDay entry for slot on create",
      async () => {
        const { organization } = await setUpOrganization();
        // add new slot to trigger slot aggregation
        await adminDb.doc(getSlotDocPath(organization, slotId)).set(baseSlot);
        // check that the slot has been aggregated to `slotsByDay`
        const expectedSlotsByDay = { [testDate]: { [baseSlot.id]: baseSlot } };
        const slotsByDayEntry = await waitForCondition({
          documentPath: getSlotsByDayDocPath(organization, testMonth),
          condition: (data) => Boolean(data && data[testDate]),
        });
        expect(slotsByDayEntry).toEqual(expectedSlotsByDay);
        // test adding another slot on different day of the same month
        await adminDb.doc(getSlotDocPath(organization, newSlotId)).set(newSlot);
        const newSlotsByDayEntry = await waitForCondition({
          documentPath: getSlotsByDayDocPath(organization, testMonth),
          condition: (data) => Boolean(data && data[dayAfter]),
        });
        expect(newSlotsByDayEntry).toEqual({
          ...slotsByDayEntry,
          [dayAfter]: { [newSlotId]: newSlot },
        });
      }
    );

    testWithEmulator(
      "should update aggregated slotsByDay on slot update",
      async () => {
        // set up test state
        const { organization } = await setUpOrganization();
        const slotRef = adminDb.doc(getSlotDocPath(organization, slotId));
        await slotRef.set(baseSlot);
        await waitForCondition({
          documentPath: getSlotsByDayDocPath(organization, testMonth),
          condition: (data) => Boolean(data && data[testDate]),
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
        const updatedSlotsByDay = await waitForCondition({
          documentPath: getSlotsByDayDocPath(organization, testMonth),
          condition: (data) =>
            Boolean(data && data[testDate][slotId].type === updatedSlot.type),
        });
        expect(updatedSlotsByDay).toEqual(expectedSlotsByDay);
      }
    );

    testWithEmulator(
      "should remove slot from slotsByDay on slot delete",
      async () => {
        // set up test state
        const { organization } = await setUpOrganization();
        await adminDb.doc(getSlotDocPath(organization, slotId)).set(baseSlot);
        const newSlotRef = adminDb.doc(getSlotDocPath(organization, slotId));
        await newSlotRef.set(newSlot);
        await waitForCondition({
          documentPath: getSlotsByDayDocPath(organization, testMonth),
          // wait until both slots are aggregated
          condition: (data) =>
            Boolean(data && data[testDate] && data[dayAfter]),
        });
        // test removing of the additional slot
        await newSlotRef.delete();
        await waitForCondition({
          documentPath: getSlotsByDayDocPath(organization, testMonth),
          condition: (data) => Boolean(data && !data[dayAfter][newSlotId]),
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
        const slotRef = adminDb.doc(getSlotDocPath(organization, slotId));
        await slotRef.set(baseSlot);
        // check proper updates triggerd by write to slot
        const docRes = await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => Boolean(data),
        });
        expect(docRes).toEqual(emptyAttendance);
        // we're manually deleting attendance to test that it won't get created on slot update
        // the attendance entry for slot shouldn't be edited manually in production
        const attendanceDocRef = adminDb.doc(
          getAttendanceDocPath(organization, slotId)
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
        const slotRef = adminDb.doc(getSlotDocPath(organization, slotId));
        await slotRef.set(baseSlot);
        await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => Boolean(data),
        });
        // delete the slot entry
        await slotRef.delete();
        // expect attendance to be deleted too
        await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => !data,
        });
      }
    );

    testWithEmulator(
      "should delete attendance entry for slot when the slot is deleted",
      async () => {
        const { organization } = await setUpOrganization();
        // we're following the same setup from the test before
        const slotRef = adminDb.doc(getSlotDocPath(organization, slotId));
        await slotRef.set(baseSlot);
        await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => Boolean(data),
        });
        // delete the slot entry
        await slotRef.delete();
        // expect attendance to be deleted too
        await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => !data,
        });
      }
    );
  });

  describe("registerCreatedOrgSecret", () => {
    testWithEmulator(
      "should update 'existingSecrets' in organization data document when secrets get added or removed",
      async () => {
        const { organization } = await setUpOrganization(true, false);
        const organizationPath = `${Collection.Organizations}/${organization}`;
        const secretsPath = `${Collection.Secrets}/${organization}`;
        // add new secret to trigger registering
        const orgSecretsRef = adminDb.doc(secretsPath);
        await orgSecretsRef.set({ testSecret: "abc123" });
        // check proper updates triggerd by write to secrets
        let existingSecrets = (
          (await waitForCondition({
            documentPath: organizationPath,
            condition: (data) => Boolean(data?.existingSecrets?.length),
          })) as OrganizationData
        ).existingSecrets;
        expect(existingSecrets).toEqual(["testSecret"]);

        // add another secret
        await orgSecretsRef.set({ anotherSecret: "abc234" }, { merge: true });
        existingSecrets = (
          (await waitForCondition({
            documentPath: organizationPath,
            condition: (data) => data?.existingSecrets.length === 2,
          })) as OrganizationData
        ).existingSecrets;
        expect(existingSecrets).toEqual(["testSecret", "anotherSecret"]);

        // removing one secret should remove it from array (without removing other secrets)
        await orgSecretsRef.set({ anotherSecret: "abc234" });
        existingSecrets = (
          (await waitForCondition({
            documentPath: organizationPath,
            condition: (data) => data?.existingSecrets.length === 1,
          })) as OrganizationData
        ).existingSecrets;
        expect(existingSecrets).toEqual(["anotherSecret"]);
      }
    );
    testWithEmulator(
      "should update 'smtpConfigured' in organization data document when smtp config is set in secrets document",
      async () => {
        const { organization } = await setUpOrganization(true, false);
        const organizationPath = `${Collection.Organizations}/${organization}`;
        const secretsPath = `${Collection.Secrets}/${organization}`;
        // add new secret to trigger registering
        const orgSecretsRef = adminDb.doc(secretsPath);
        await orgSecretsRef.set({
          smtpHost: "localhost",
          smtpPort: 4000,
          smtpUser: "user",
          smtpPass: "password",
        });
        // check proper updates triggerd by write to secrets
        const orgData = (await waitForCondition({
          documentPath: organizationPath,
          condition: (data) => Boolean(data?.existingSecrets?.length),
        })) as OrganizationData;
        expect(orgData.existingSecrets).toEqual(
          expect.arrayContaining([
            "smtpHost",
            "smtpPort",
            "smtpUser",
            "smtpPass",
          ])
        );
        expect(orgData.smtpConfigured).toEqual(true);
      }
    );
    testWithEmulator(
      "should not update 'smtpConfigured' in organization data document if not all smtp config is set in secrets document",
      async () => {
        const { organization } = await setUpOrganization(true, false);
        const organizationPath = `${Collection.Organizations}/${organization}`;
        const secretsPath = `${Collection.Secrets}/${organization}`;
        // add new secret to trigger registering
        const orgSecretsRef = adminDb.doc(secretsPath);
        await orgSecretsRef.set({
          smtpHost: "localhost",
          smtpUser: "user",
          smtpPass: "password",
        });
        // check proper updates triggerd by write to secrets
        const orgData = (await waitForCondition({
          documentPath: organizationPath,
          condition: (data) => Boolean(data?.existingSecrets?.length),
        })) as OrganizationData;
        expect(orgData.existingSecrets).toEqual(
          expect.arrayContaining(["smtpHost", "smtpUser", "smtpPass"])
        );
        expect(orgData.smtpConfigured).toBeFalsy();
      }
    );
  });
  describe("createPublicOrgInfo", () => {
    testWithEmulator(
      "should update/create general info in organization data to publicOrgInfo collection when organization data is updated",
      async () => {
        // use random string for organization to ensure test is ran in pristine environment each time
        // but avoid `setUpOrganization()` as we want to set up organization ourselves
        const organization = uuid();
        const { displayName, location, emailFrom } = organizationData;

        const publicOrgPath = `${Collection.PublicOrgInfo}/${organization}`;
        const orgPath = `${Collection.Organizations}/${organization}`;

        // check for non existence of publicOrgInfo before creating a new organization
        const publicOrgSnap = await adminDb.doc(publicOrgPath).get();
        expect(publicOrgSnap.exists).toBeFalsy();

        // create new organization
        const orgRef = adminDb.doc(orgPath);
        await orgRef.set(organizationData);

        // check for publicOrgInfo
        const docRes = await waitForCondition({
          documentPath: publicOrgPath,
          condition: (data) => Boolean(data),
        });
        expect(docRes).toEqual({ displayName, location, emailFrom });

        // test non existence of publicOrgInfo after organization is deleted
        await orgRef.delete();
        await waitForCondition({
          documentPath: publicOrgPath,
          condition: (data) => Boolean(!data),
        });
      }
    );
  });
  describe("createAttendedSlotsForAttendance", () => {
    testWithEmulator(
      "should create document in attendedSlots collection when customer is marked as attended",
      async () => {
        const { organization } = await setUpOrganization();
        // create customer and slot

        await adminDb.doc(getSlotDocPath(organization, slotId)).set(baseSlot);
        // await slotRef.set(baseSlot);
        await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => Boolean(data),
        });

        const customerRef = adminDb.doc(
          getCustomerDocPath(organization, saul.id)
        );
        await customerRef.set(saul);

        const nonBookedattendanceWithTestCustomerAttendances = {
          [saul.id]: {
            ...attendanceWithTestCustomer.attendances[saul.id],

            bookedInterval: null,
          },
        };
        // set attendance for customer
        await adminDb.doc(getAttendanceDocPath(organization, slotId)).set({
          ...attendanceWithTestCustomer,
          attendances: { ...nonBookedattendanceWithTestCustomerAttendances },
        });

        // // get document in attended slots
        const docRes = await waitForCondition({
          documentPath: getAttendedSlotDocPath(
            organization,
            saul.secretKey,
            slotId
          ),
          condition: (data) => Boolean(data && data.interval),
        });
        const attendedSlot = {
          date: baseSlot.date,
          interval:
            attendanceWithTestCustomer.attendances[saul.id].attendedInterval,
        };
        // assert it has same date and interval as attended
        expect(docRes).toEqual(attendedSlot);
      }
    );
    testWithEmulator(
      "should delete document in attendedSlots collection when customer is marked as absent",
      async () => {
        const { organization } = await setUpOrganization();
        // create customer and slot

        await adminDb.doc(getSlotDocPath(organization, slotId)).set(baseSlot);
        // await slotRef.set(baseSlot);
        await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => Boolean(data),
        });

        const customerRef = adminDb.doc(
          getCustomerDocPath(organization, saul.id)
        );
        await customerRef.set(saul);
        await waitForCondition({
          documentPath: getCustomerDocPath(organization, saul.id),
          condition: (data) => Boolean(data),
        });

        // set attendance
        const nonBookedattendanceWithTestCustomerAttendances = {
          [saul.id]: {
            ...attendanceWithTestCustomer.attendances[saul.id],

            bookedInterval: null,
          },
        };
        // set attendance for customer
        await adminDb.doc(getAttendanceDocPath(organization, slotId)).set({
          ...attendanceWithTestCustomer,
          attendances: { ...nonBookedattendanceWithTestCustomerAttendances },
        });

        // // get document in attended slots
        const docRes = await waitForCondition({
          documentPath: getAttendedSlotDocPath(
            organization,
            saul.secretKey,
            slotId
          ),
          condition: (data) => Boolean(data && data.interval),
        });
        const attendedSlot = {
          date: baseSlot.date,
          interval:
            attendanceWithTestCustomer.attendances[saul.id].attendedInterval,
        };
        // assert it has same date and interval as attended
        expect(docRes).toEqual(attendedSlot);

        // set empty attendance for customer
        await adminDb
          .doc(getAttendanceDocPath(organization, slotId))
          .set({ ...attendanceWithTestCustomer, attendances: {} });

        // get document in attended slots

        const docResEmpty = await waitForCondition({
          documentPath: getAttendedSlotDocPath(
            organization,
            saul.secretKey,
            slotId
          ),
          condition: (data) => Boolean(!data),
        });

        // assert it doesn't exist
        expect(docResEmpty).toBeUndefined();
      }
    );
    testWithEmulator(
      "should not create document in attendedSlots collection if customer had booked the slot",
      async () => {
        const { organization } = await setUpOrganization();
        // create customer and slot

        await adminDb.doc(getSlotDocPath(organization, slotId)).set(baseSlot);
        // await slotRef.set(baseSlot);
        await waitForCondition({
          documentPath: getAttendanceDocPath(organization, slotId),
          condition: (data) => Boolean(data),
        });

        const customerRef = adminDb.doc(
          getCustomerDocPath(organization, saul.id)
        );
        await customerRef.set(saul);
        await waitForCondition({
          documentPath: getCustomerDocPath(organization, saul.id),
          condition: (data) => Boolean(data),
        });

        const bookedAttendanceWithTestCustomerAttendances = {
          [saul.id]: {
            ...attendanceWithTestCustomer.attendances[saul.id],
          },
        };
        // set attendance for customer
        await adminDb.doc(getAttendanceDocPath(organization, slotId)).set({
          ...attendanceWithTestCustomer,
          attendances: { ...bookedAttendanceWithTestCustomerAttendances },
        });

        // // get document in attended slots
        const docRes = await waitForCondition({
          documentPath: getAttendedSlotDocPath(
            organization,
            saul.secretKey,
            slotId
          ),
          condition: (data) => Boolean(!data),
        });

        expect(docRes).toBeUndefined();
      }
    );
    testWithEmulator("should mark multiple athletes as attended", async () => {
      const { organization } = await setUpOrganization();

      await adminDb.doc(getSlotDocPath(organization, slotId)).set(baseSlot);
      await waitForCondition({
        documentPath: getAttendanceDocPath(organization, slotId),
        condition: (data) => Boolean(data),
      });

      // set two customers
      const saulrRef = adminDb.doc(getCustomerDocPath(organization, saul.id));
      await saulrRef.set(saul);

      const waltCustomerRef = adminDb.doc(
        getCustomerDocPath(organization, walt.id)
      );
      await waltCustomerRef.set(walt);

      // set nonBooked attendance for saul

      const saulNonBookedAttendance = {
        [saul.id]: {
          bookedInterval: null,
          attendedInterval: intervals[1],
        },
      };

      await adminDb.doc(getAttendanceDocPath(organization, slotId)).set({
        ...attendanceWithTestCustomer,
        attendances: { ...saulNonBookedAttendance },
      });

      await waitForCondition({
        documentPath: getAttendanceDocPath(organization, slotId),
        condition: (data) => Boolean(data),
      });

      // set nonBooked attendance for walt

      const waltNonBookedAttendance = {
        [saul.id]: {
          bookedInterval: null,
          attendedInterval: intervals[1],
        },
        [walt.id]: {
          bookedInterval: null,
          attendedInterval: intervals[1],
        },
      };

      await adminDb.doc(getAttendanceDocPath(organization, slotId)).set({
        ...attendanceWithTestCustomer,
        attendances: { ...waltNonBookedAttendance },
      });

      await waitForCondition({
        documentPath: getAttendanceDocPath(organization, slotId),
        condition: (data) => Boolean(data),
      });

      // get documents in attended slots

      const saulResUpdated = await waitForCondition({
        documentPath: getAttendedSlotDocPath(
          organization,
          saul.secretKey,
          slotId
        ),
        condition: (data) => Boolean(data),
      });

      // saul's attendedSlot
      const saulUpdatedAttendedSlot = {
        date: baseSlot.date,
        interval: intervals[1],
      };

      const waltDocResUpdated = await waitForCondition({
        documentPath: getAttendedSlotDocPath(
          organization,
          walt.secretKey,
          slotId
        ),
        condition: (data) => Boolean(data),
      });

      const waltUpdatedAttendedSlot = {
        date: baseSlot.date,
        interval: intervals[1],
      };

      // assert they're both there

      expect(saulResUpdated).toEqual(saulUpdatedAttendedSlot);

      expect(waltDocResUpdated).toEqual(waltUpdatedAttendedSlot);
    });
    testWithEmulator(
      "should update document in attendedSlots collection if attended interval changes",
      async () => {
        const { organization } = await setUpOrganization();
        // create customer and slot

        await adminDb.doc(getSlotDocPath(organization, slotId)).set(baseSlot);

        const customerRef = adminDb.doc(
          getCustomerDocPath(organization, saul.id)
        );
        await customerRef.set(saul);

        const attendance = {
          [saul.id]: {
            ...attendanceWithTestCustomer.attendances[saul.id],

            bookedInterval: null,
          },
        };

        await adminDb.doc(getAttendanceDocPath(organization, slotId)).set({
          ...attendanceWithTestCustomer,
          attendances: { ...attendance },
        });

        // update interval
        const updatedAttendance = {
          [saul.id]: {
            bookedInterval: null,
            attendedInterval: intervals[1],
          },
        };

        await adminDb.doc(getAttendanceDocPath(organization, slotId)).set({
          ...attendanceWithTestCustomer,
          attendances: { ...updatedAttendance },
        });

        // get document in attended slots

        const docResUpdated = await waitForCondition({
          documentPath: getAttendedSlotDocPath(
            organization,
            saul.secretKey,
            slotId
          ),
          condition: (data) => Boolean(data),
        });

        const updatedAttendedSlot = {
          date: baseSlot.date,
          interval: intervals[1],
        };

        // assert it equals the updated version

        expect(docResUpdated).toEqual(updatedAttendedSlot);
      }
    );
  });
});
