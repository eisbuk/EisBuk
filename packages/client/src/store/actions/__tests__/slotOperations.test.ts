/**
 * @jest-environment node
 */

import * as firestore from "@firebase/firestore";

import {
  Category,
  Collection,
  OrgSubCollection,
  SlotType,
} from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getTestEnv } from "@/__testSetup__/firestore";

import { getNewStore } from "@/store/createStore";

import { getOrganization } from "@/lib/getters";

import { Action, NotifVariant } from "@/enums/store";

import { createNewSlot, deleteSlot, updateSlot } from "../slotOperations";
import * as appActions from "../appActions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestSlots } from "../__testUtils__/firestore";

import { loginDefaultUser } from "@/__testUtils__/auth";

import {
  initialSlotIds,
  initialSlots,
  testFormValues,
  testSlot,
} from "../__testData__/slotOperations";

const slotsCollectionPath = `${Collection.Organizations}/${getOrganization()}/${
  OrgSubCollection.Slots
}`;

/**
 * Mock `enqueueSnackbar` implementation for easier testing.
 * Here we're using the same implmentation as the original function (action creator),
 * only omitting the notification key (as this is simpler)
 */
const mockEnqueueSnackbar = ({
  // we're omitting the key as it is, in most cases, signed with date and random number
  // and this is easier than mocking `Date` object to always return the same value
  // and seeding random to given value
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  key,
  ...notification
}: Parameters<typeof appActions.enqueueNotification>[0]) => ({
  type: Action.EnqueueNotification,
  payload: { ...notification },
});

// mock `enqueueSnackbar` in component
jest
  .spyOn(appActions, "enqueueNotification")
  .mockImplementation(mockEnqueueSnackbar as any);

/**
 * A mock function we're passing to `setupTestSlots` and returning as `dispatch`
 */
const mockDispatch = jest.fn();

/**
 * A spy of `getFirebase` function which we're occasionally mocking to throw error
 * for error handling tests
 */
const getFirestoreSpy = jest.spyOn(firestore, "getFirestore");

/**
 * Passing this for typesafety where the actual `store.getState` isn't needed
 */
const dummyGetState = () => ({} as any);

describe("Slot operations ->", () => {
  beforeEach(async () => {
    await loginDefaultUser();
    jest.clearAllMocks();
  });

  describe("createSlot ->", () => {
    testWithEmulator(
      "should add new slot to firestore (with generated uuid) and show success notification",
      async () => {
        // set up initial state
        const store = getNewStore();
        const db = await getTestEnv({
          setup: (db) => setupTestSlots({ db, store, slots: initialSlots }),
        });
        // make sure test uses the test firestore db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk
        await createNewSlot(testFormValues)(mockDispatch, store.getState);
        const slotsCollRef = firestore.collection(db, slotsCollectionPath);
        const slotsInFS = (await firestore.getDocs(slotsCollRef)).docs;
        // check that the new slot was created
        expect(slotsInFS.length).toEqual(3);
        // since we're not setting the id manually, we're finding our test slot by filtering out initial slot ids
        const testSlotInFS = slotsInFS
          .find((slot) => !initialSlotIds.includes(slot.data().id))
          ?.data() || { id: "fail" };
        // check that new slot contains proper data
        expect(testSlotInFS).toEqual({
          ...testSlot,
          id: testSlotInFS.id,
        });
        // check for success notification
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: i18n.t(NotificationMessage.SlotAdded),
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
          })
        );
      }
    );

    testWithEmulator(
      "should show error notification if operation is failed",
      async () => {
        // intentionally cause error
        getFirestoreSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the thunk
        await createNewSlot(testFormValues)(mockDispatch, dummyGetState);
        // check err snackbar being called
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
      }
    );
  });

  describe("editSlot ->", () => {
    testWithEmulator(
      "should edit an existing slot in firestore and show succes notification",
      async () => {
        // set up initial state
        const slotId = "test-slot";
        const store = getNewStore();
        const db = await getTestEnv({
          setup: (db) =>
            setupTestSlots({
              db,
              store,
              slots: { ...initialSlots, [slotId]: { ...testSlot, id: slotId } },
            }),
        });
        // make sure test uses the test firestore db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // updates we're applying to slot
        const updates = {
          categories: Object.values(Category),
          type: SlotType.OffIce,
          intervals: [
            {
              startTime: "09:00",
              endTime: "10:00",
            },
          ],
        };
        // run the thunk
        await updateSlot({
          ...testFormValues,
          ...updates,
          id: slotId,
        })(mockDispatch, store.getState);
        // check that the slot is properly updated
        const slotDocRef = firestore.doc(db, slotsCollectionPath, slotId);
        const testSlotInFS = (await firestore.getDoc(slotDocRef)).data();
        expect(testSlotInFS).toEqual({
          ...testSlot,
          id: slotId,
          ...updates,
          intervals: {
            ["09:00-10:00"]: updates.intervals[0],
          },
        });
        // check that the success notif has been called
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: i18n.t(NotificationMessage.SlotUpdated),
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
          })
        );
      }
    );

    testWithEmulator(
      "should show error notification if operation is failed",
      async () => {
        // intentionally cause error
        getFirestoreSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the failing thunk
        await updateSlot({
          ...testFormValues,
          id: "slot",
        })(mockDispatch, dummyGetState);
        // check err snackbar being called
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
      }
    );
  });

  describe("deleteSlot ->", () => {
    testWithEmulator(
      "should delete slot from firestore and show succes notification",
      async () => {
        // set up initial state
        const slotId = "test-slot";
        const store = getNewStore();
        const db = await getTestEnv({
          setup: (db) =>
            setupTestSlots({
              db,
              store,
              slots: { ...initialSlots, [slotId]: { ...testSlot, id: slotId } },
            }),
        });
        // make sure test uses the test firestore db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk
        await deleteSlot(slotId)(mockDispatch, store.getState);
        // check that the slot was deleted from db
        const slotsCollRef = firestore.collection(db, slotsCollectionPath);
        const slotsInFS = (await firestore.getDocs(slotsCollRef)).docs;
        expect(slotsInFS.length).toEqual(2);
        // check that the success notif has been called
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: i18n.t(NotificationMessage.SlotDeleted),
            closeButton: true,
            options: {
              variant: NotifVariant.Success,
            },
          })
        );
      }
    );

    testWithEmulator(
      "should show error notification if operation is failed",
      async () => {
        // intentionally cause error
        getFirestoreSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run the failing thunk
        await deleteSlot("id")(mockDispatch, dummyGetState);
        // check err snackbar being called
        expect(mockDispatch).toHaveBeenCalledWith(appActions.showErrSnackbar);
      }
    );
  });
});
