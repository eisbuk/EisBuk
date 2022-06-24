/**
 * @jest-environment node
 */

import * as firestore from "@firebase/firestore";
import { collection, doc, getDoc, getDocs } from "@firebase/firestore";

import { Category, SlotType } from "@eisbuk/shared";
import i18n, { NotificationMessage } from "@eisbuk/translations";

import { getTestEnv } from "@/__testSetup__/firestore";

import { getNewStore } from "@/store/createStore";

import * as getters from "@/lib/getters";

import { Action, NotifVariant } from "@/enums/store";

import { createNewSlot, deleteSlot, updateSlot } from "../slotOperations";
import * as appActions from "../appActions";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestSlots } from "../__testUtils__/firestore";

import {
  initialSlotIds,
  initialSlots,
  testFormValues,
  testSlot,
} from "../__testData__/slotOperations";
import { getSlotDocPath, getSlotsPath } from "@/utils/firestore";

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

const mockDispatch = jest.fn();

const getFirestoreSpy = jest.spyOn(firestore, "getFirestore");
const getOrganizationSpy = jest.spyOn(getters, "getOrganization");

/**
 * Passing this for typesafety where the actual `store.getState` isn't needed
 */
const dummyGetState = () => ({} as any);

describe("Slot operations ->", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe("createSlot ->", () => {
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
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // make sure test uses the test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // run the thunk
        await createNewSlot(testFormValues)(mockDispatch, store.getState);
        const slotsCollRef = collection(db, getSlotsPath(organization));
        const slotsInFS = (await getDocs(slotsCollRef)).docs;
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
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // make sure test uses the test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
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
        const slotDocRef = doc(db, getSlotDocPath(organization, slotId));
        const testSlotInFS = (await getDoc(slotDocRef)).data();
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
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // make sure test uses the test generated organization
        getOrganizationSpy.mockReturnValueOnce(organization);
        // run the thunk
        await deleteSlot(slotId)(mockDispatch, store.getState);
        // check that the slot was deleted from db
        const slotsCollRef = collection(db, getSlotsPath(organization));
        const slotsInFS = (await getDocs(slotsCollRef)).docs;
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
