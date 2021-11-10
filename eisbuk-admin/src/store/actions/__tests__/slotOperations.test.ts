import * as firestore from "@firebase/firestore";

import {
  Category,
  Collection,
  OrgSubCollection,
  SlotType,
} from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import { NotificationMessage } from "@/lib/notifications";

import { Action, NotifVariant } from "@/enums/store";

import { createNewSlot, deleteSlot, updateSlot } from "../slotOperations";
import * as appActions from "../appActions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestSlots } from "../__testUtils__/firestore";
import { deleteAll } from "@/tests/utils";

import {
  initialSlotIds,
  initialSlots,
  testFromValues,
  testSlot,
} from "../__testData__/slotOperations";

// mocked return value for `enqueueErrSnackbar`.
// the actual return value is the thunk, but we're using this to easily test dispatching
const errNotifAction = { type: "err_spy" };
jest
  .spyOn(appActions, "showErrSnackbar")
  .mockImplementation(() => errNotifAction as any);

const mockDispatch = jest.fn();

const db = firestore.getFirestore();
const slotsCollectionPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Slots}`;

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
 * A spy of `getFirebase` function which we're occasionally mocking to throw error
 * for error handling tests
 */
const getFirebaseSpy = jest.spyOn(firestore, "getFirestore");

// we're mocking `t` from `i18next` to be an identity function for easier testing
jest.mock("i18next", () => ({
  t: (label: string) => label,
}));

describe("Slot operations ->", () => {
  afterEach(async () => {
    await Promise.all([deleteAll([OrgSubCollection.Slots])]);
    jest.clearAllMocks();
  });

  describe("createSlot ->", () => {
    testWithEmulator(
      "should add new slot to firestore (with generated uuid) and show success notification",
      async () => {
        // set up initial state
        const thunkArgs = await setupTestSlots({
          slots: initialSlots,
          dispatch: mockDispatch,
        });
        // create a thunk curried with test input values
        const testThunk = createNewSlot(testFromValues);
        await testThunk(...thunkArgs);
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
            message: NotificationMessage.SlotAdded,
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
        getFirebaseSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run thunk
        const thunkArgs = await setupTestSlots({
          slots: initialSlots,
          dispatch: mockDispatch,
        });
        const testThunk = createNewSlot(testFromValues);
        await testThunk(...thunkArgs);
        // check err snackbar being called
        expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
      }
    );
  });

  describe("editSlot ->", () => {
    testWithEmulator(
      "should edit an existing slot in firestore and show succes notification",
      async () => {
        const slotId = "test-slot";
        // set up initial state
        const thunkArgs = await setupTestSlots({
          slots: {
            ...initialSlots,
            [slotId]: { ...testSlot, id: slotId },
          },
          dispatch: mockDispatch,
        });
        // updates we're applying to slot
        const updates = {
          categories: Object.values(Category),
          type: SlotType.OffIceDancing,
          intervals: [
            {
              startTime: "09:00",
              endTime: "10:00",
            },
          ],
        };
        // create a thunk curried with updated form values
        const testThunk = updateSlot({
          ...testFromValues,
          ...updates,
          id: slotId,
        });
        await testThunk(...thunkArgs);
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
            message: NotificationMessage.SlotUpdated,
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
        getFirebaseSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run thunk
        const thunkArgs = await setupTestSlots({
          slots: initialSlots,
          dispatch: mockDispatch,
        });
        const testThunk = updateSlot({
          ...testFromValues,
          id: "slot",
        });
        await testThunk(...thunkArgs);
        // check err snackbar being called
        expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
      }
    );
  });

  describe("deleteSlot ->", () => {
    testWithEmulator(
      "should delete slot from firestore and show succes notification",
      async () => {
        const slotId = "test-slot";
        // set up initial state
        const thunkArgs = await setupTestSlots({
          slots: {
            ...initialSlots,
            [slotId]: { ...testSlot, id: slotId },
          },
          dispatch: mockDispatch,
        });
        // create a thunk curried with slot id
        const testThunk = deleteSlot(slotId);
        await testThunk(...thunkArgs);
        // check that the slot was deleted from db
        const slotsCollRef = firestore.collection(db, slotsCollectionPath);
        const slotsInFS = (await firestore.getDocs(slotsCollRef)).docs;
        expect(slotsInFS.length).toEqual(2);
        // check that the success notif has been called
        expect(mockDispatch).toHaveBeenCalledWith(
          mockEnqueueSnackbar({
            message: NotificationMessage.SlotDeleted,
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
        getFirebaseSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        // run thunk-slot";
        // set up initial state
        const thunkArgs = await setupTestSlots({
          slots: initialSlots,
          dispatch: mockDispatch,
        });
        // create a thunk curried with slot id
        const testThunk = deleteSlot("id");
        await testThunk(...thunkArgs);
        // check err snackbar being called
        expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
      }
    );
  });
});
