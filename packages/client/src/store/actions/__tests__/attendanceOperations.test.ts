/**
 * @jest-environment node
 */

import * as firestore from "@firebase/firestore";

import * as getters from "@/lib/getters";

import { getTestEnv } from "@/__testSetup__/firestore";

import { getNewStore } from "@/store/createStore";

import { markAbsence, markAttendance } from "../attendanceOperations";
import { showErrSnackbar } from "../appActions";

import { getAttendanceDocPath } from "@/utils/firestore";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestAttendance } from "../__testUtils__/firestore";

import {
  createDocumentWithObservedAttendance,
  observedSlotId,
} from "../__testData__/attendanceOperations";

// test data
const customerId = "customer-0";
const slotId = observedSlotId;
const bookedInterval = "11:00-12:00";
const attendedInterval = "11:00-12:30";

const getFirestoreSpy = jest.spyOn(firestore, "getFirestore");
const getOrganizationSpy = jest.spyOn(getters, "getOrganization");

describe("Attendance operations ->", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("markAttendance ->", () => {
    testWithEmulator(
      "should update attendance for provided customer on provided slot (and not overwrite the rest of the data for given document in the process)",
      async () => {
        // set up test state
        const store = getNewStore();
        const initialDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval: null, bookedInterval },
        });
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestAttendance({
              store,
              db,
              attendance: { [slotId]: initialDoc },
              organization,
            }),
        });
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // make sure test thunk uses the test env db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk with test input values
        await markAttendance({
          customerId,
          slotId,
          attendedInterval,
        })(store.dispatch, store.getState);
        // check updated db
        const expectedDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval, bookedInterval },
        });
        const docRef = firestore.doc(
          db,
          getAttendanceDocPath(organization, slotId)
        );
        const resData = (await firestore.getDoc(docRef)).data();
        expect(resData).toEqual(expectedDoc);
      }
    );

    testWithEmulator(
      "should create new entry if customer didn't book",
      async () => {
        // set up test state
        const store = getNewStore();
        const initialDoc = createDocumentWithObservedAttendance({});
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestAttendance({
              store,
              db,
              attendance: { [slotId]: initialDoc },
              organization,
            }),
        });
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // make sure test thunk uses the test env db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk with test input values
        await markAttendance({
          customerId,
          slotId,
          attendedInterval,
        })(store.dispatch, store.getState);
        // check updated db
        // booked should be null (since customer didn't book beforehand, but did attend)
        const expectedDoc = createDocumentWithObservedAttendance({
          [customerId]: { bookedInterval: null, attendedInterval },
        });
        const docRef = firestore.doc(
          db,
          getAttendanceDocPath(organization, slotId)
        );
        const resData = (await firestore.getDoc(docRef)).data();
        expect(resData).toEqual(expectedDoc);
      }
    );

    testWithEmulator(
      "should enqueue error snackbar if update not successful",
      async () => {
        // set up test state
        const store = getNewStore();
        const initialDoc = createDocumentWithObservedAttendance({});
        await getTestEnv({
          setup: (db, { organization }) =>
            setupTestAttendance({
              store,
              db,
              attendance: { [slotId]: initialDoc },
              organization,
            }),
        });
        // cause synthetic error in execution
        getFirestoreSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        const mockDispatch = jest.fn();
        await markAttendance({
          customerId,
          slotId,
          attendedInterval,
        })(mockDispatch, store.getState);
        expect(mockDispatch).toHaveBeenCalledWith(showErrSnackbar);
      }
    );
  });

  describe("markAbsence ->", () => {
    testWithEmulator(
      "should mark customers attended interval as 'null' if customer booked beforehand (and not overwrite the rest of the data for given document in the process)",
      async () => {
        // set up test state
        const store = getNewStore();
        const initialDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval, bookedInterval },
        });
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestAttendance({
              store,
              db,
              attendance: { [slotId]: initialDoc },
              organization,
            }),
        });
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // make sure test thunk uses the test env db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk with test input values
        await markAbsence({
          customerId,
          slotId,
        })(store.dispatch, store.getState);
        // check updated db
        const expectedDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval: null, bookedInterval },
        });
        const docRef = firestore.doc(
          db,
          getAttendanceDocPath(organization, slotId)
        );
        const resData = (await firestore.getDoc(docRef)).data();
        expect(resData).toEqual(expectedDoc);
      }
    );

    testWithEmulator(
      "should remove customer from attendance record for slot if customer didn't book (and is marked absent)",
      async () => {
        // set up test state
        const store = getNewStore();
        const initialDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval, bookedInterval: null },
        });
        const { db, organization } = await getTestEnv({
          setup: (db, { organization }) =>
            setupTestAttendance({
              store,
              db,
              attendance: { [slotId]: initialDoc },
              organization,
            }),
        });
        // make sure tested thunk uses test generated organization
        getOrganizationSpy.mockReturnValue(organization);
        // make sure test thunk uses the test env db
        getFirestoreSpy.mockReturnValueOnce(db as any);
        // run the thunk with test input values
        await markAbsence({
          customerId,
          slotId,
        })(store.dispatch, store.getState);
        // check updated db
        // the customer should be removed (only the rest of the test data should be in the doc)
        const expectedDoc = createDocumentWithObservedAttendance({});
        const docRef = firestore.doc(
          db,
          getAttendanceDocPath(organization, slotId)
        );
        const resData = (await firestore.getDoc(docRef)).data();
        expect(resData).toEqual(expectedDoc);
      }
    );

    testWithEmulator(
      "should enqueue error snackbar if update not successful",
      async () => {
        // set up test state
        const store = getNewStore();
        const initialDoc = createDocumentWithObservedAttendance({});
        await getTestEnv({
          setup: (db, { organization }) =>
            setupTestAttendance({
              store,
              db,
              attendance: { [slotId]: initialDoc },
              organization,
            }),
        });
        // cause synthetic error in execution
        getFirestoreSpy.mockImplementationOnce(() => {
          throw new Error();
        });
        const mockDispatch = jest.fn();
        await markAbsence({
          customerId,
          slotId,
        })(mockDispatch, store.getState);
        expect(mockDispatch).toHaveBeenCalledWith(showErrSnackbar);
      }
    );
  });
});
