/**
 * @vitest-environment node
 */

import { describe, vi, expect, beforeEach, test } from "vitest";
import { QueryDocumentSnapshot } from "@firebase/firestore";

import { Category, SlotType } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getTestEnv } from "@/__testSetup__/firestore";

import { getNewStore } from "@/store/createStore";

import * as getters from "@/lib/getters";

import { NotifVariant } from "@/enums/store";

import { deleteSlot, upsertSlot } from "../slotOperations";
import { enqueueNotification } from "@/features/notifications/actions";

import {
  getSlotDocPath,
  getSlotsPath,
  collection,
  doc,
  getDoc,
  getDocs,
} from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestSlots } from "../__testUtils__/firestore";

import {
  initialSlotIds,
  initialSlots,
  testSlot,
} from "../__testData__/slotOperations";

const mockDispatch = vi.fn();
vi.mock("react-redux", async () => {
  const rr = (await vi.importActual("react-redux")) as object;

  return {
    ...rr,
    useDispatch: () => mockDispatch,
  };
});

const getOrganizationSpy = vi.spyOn(getters, "getOrganization");

/**
 * Passing this for typesafety where the actual `store.getState` isn't needed
 */
const dummyGetState = () => ({} as any);

describe("Slot operations", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe("create new slot", () => {
    testWithEmulator(
      "should add new slot to firestore (with generated uuid) and show success notification",
      async () => {
        // set up initial state
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestSlots({ db, store, slots: initialSlots, organization }),
        });
        // make sure test uses the test firestore db
        const getFirestore = () => db.instance as any;
        // make sure test uses the test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // run the thunk
        await upsertSlot(testSlot)(mockDispatch, store.getState, {
          getFirestore,
        });
        const slotsCollRef = collection(db, getSlotsPath(organization));
        const slotsInFS = (await getDocs(slotsCollRef)).docs;
        // check that the new slot was created
        expect(slotsInFS.length).toEqual(3);
        // since we're not setting the id manually, we're finding our test slot by filtering out initial slot ids
        const testSlotInFS = (slotsInFS as QueryDocumentSnapshot[])
          .find((slot) => !initialSlotIds.includes(slot.data().id))
          ?.data() || { id: "fail" };
        // check that new slot contains proper data
        expect(testSlotInFS).toEqual({
          ...testSlot,
          id: testSlotInFS.id,
        });
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SlotAdded),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    test("should show error notification if operation is failed", async () => {
      // intentionally cause error
      const testError = new Error("test");
      const getFirestore = () => {
        throw testError;
      };
      // run the thunk
      await upsertSlot(testSlot)(mockDispatch, dummyGetState, { getFirestore });
      // check err snackbar being called
      expect(mockDispatch).toHaveBeenCalledWith(
        enqueueNotification({
          message: i18n.t(NotificationMessage.SlotAddError),
          variant: NotifVariant.Error,
          error: testError,
        })
      );
    });
  });

  describe("update slot", () => {
    testWithEmulator(
      "should edit an existing slot in firestore and show succes notification",
      async () => {
        // set up initial state
        const slotId = "test-slot";
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestSlots({
              db,
              store,
              slots: { ...initialSlots, [slotId]: { ...testSlot, id: slotId } },
              organization,
            }),
        });
        // make sure test uses the test firestore db
        const getFirestore = () => db.instance as any;
        // make sure test uses the test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // updates we're applying to slot
        const updates = {
          categories: Object.values(Category),
          type: SlotType.OffIce,
          intervals: {
            "09:00-10:00": {
              startTime: "09:00",
              endTime: "10:00",
            },
          },
        };
        // run the thunk
        await upsertSlot({
          ...testSlot,
          ...updates,
          id: slotId,
        })(mockDispatch, store.getState, { getFirestore });
        // check that the slot is properly updated
        const slotDocRef = doc(db, getSlotDocPath(organization, slotId));
        const testSlotInFS = (await getDoc(slotDocRef)).data();
        expect(testSlotInFS).toEqual({
          ...testSlot,
          id: slotId,
          ...updates,
        });
        // check that the success notif has been called
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SlotUpdated),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    testWithEmulator(
      "should show error notification if operation is failed",
      async () => {
        // intentionally cause error
        const testError = new Error("test");
        const getFirestore = () => {
          throw testError;
        };
        // run the failing thunk
        await upsertSlot({
          ...testSlot,
          id: "slot",
        })(mockDispatch, dummyGetState, { getFirestore });
        // check err snackbar being called
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SlotUpdateError),
            variant: NotifVariant.Error,
            error: testError,
          })
        );
      }
    );
  });

  describe("deleteSlot", () => {
    testWithEmulator(
      "should delete slot from firestore and show succes notification",
      async () => {
        // set up initial state
        const slotId = "test-slot";
        const store = getNewStore();
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestSlots({
              db,
              store,
              slots: { ...initialSlots, [slotId]: { ...testSlot, id: slotId } },
              organization,
            }),
        });
        // make sure test uses the test firestore db
        const getFirestore = () => db.instance as any;
        // make sure test uses the test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // run the thunk
        await deleteSlot(slotId)(mockDispatch, store.getState, {
          getFirestore,
        });
        // check that the slot was deleted from db
        const slotsCollRef = collection(db, getSlotsPath(organization));
        const slotsInFS = (await getDocs(slotsCollRef)).docs;
        expect(slotsInFS.length).toEqual(2);
        // check that the success notif has been called
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SlotDeleted),
            variant: NotifVariant.Success,
          })
        );
      }
    );

    testWithEmulator(
      "should show error notification if operation is failed",
      async () => {
        // intentionally cause error
        const testError = new Error("test");
        const getFirestore = () => {
          throw testError;
        };
        // run the failing thunk
        await deleteSlot("id")(mockDispatch, dummyGetState, { getFirestore });
        // check err snackbar being called
        expect(mockDispatch).toHaveBeenCalledWith(
          enqueueNotification({
            message: i18n.t(NotificationMessage.SlotDeleteError),
            variant: NotifVariant.Error,
            error: testError,
          })
        );
      }
    );
  });
});
