import * as firestore from "@firebase/firestore";

import { Collection, OrgSubCollection } from "eisbuk-shared";

import { ORGANIZATION } from "@/config/envInfo";

import { markAbsence, markAttendance } from "../attendanceOperations";
import * as appActions from "../appActions";

import {
  createDocumentWithObservedAttendance,
  observedSlotId,
} from "../__testData__/attendanceOperations";

import { testWithEmulator } from "@/__testUtils__/envUtils";
import { setupTestAttendance } from "../__testUtils__/firestore";

// test data
const customerId = "customer-0";
const slotId = "slot-0";
const bookedInterval = "11:00-12:00";
const attendedInterval = "11:00-12:30";

// mocked return value for `enqueueErrSnackbar`.
// the actual return value is the thunk, but we're using this to easily test dispatching
const errNotifAction = { type: "err_spy" };
jest
  .spyOn(appActions, "showErrSnackbar")
  .mockImplementation(() => errNotifAction as any);

// a jest mock function we're using to pass as dispatch at certain points
const mockDispatch = jest.fn();

const db = firestore.getFirestore();
const attendaceCollectionPath = `${Collection.Organizations}/${ORGANIZATION}/${OrgSubCollection.Attendance}`;

describe("Attendance operations ->", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("markAttendance ->", () => {
    testWithEmulator(
      "should update attendance for provided customer on provided slot (and not overwrite the rest of the data for given document in the process)",
      async () => {
        const initialDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval: null, bookedInterval },
        });
        // set up initial state
        const thunkArgs = await setupTestAttendance({
          attendance: { [slotId]: initialDoc },
        });
        // create a thunk curried with test input values
        const testThunk = markAttendance({
          customerId,
          slotId: observedSlotId,
          attendedInterval,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(...thunkArgs);
        const expectedDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval, bookedInterval },
        });
        // check updated db
        const docRef = firestore.doc(db, attendaceCollectionPath, slotId);
        const resData = (await firestore.getDoc(docRef)).data();
        expect(resData).toEqual(expectedDoc);
      }
    );

    testWithEmulator(
      "should create new entry if customer didn't book",
      async () => {
        // create document with customer not present in the record
        const initialDoc = createDocumentWithObservedAttendance({});
        // set up initial state
        const thunkArgs = await setupTestAttendance({
          attendance: { [slotId]: initialDoc },
        });
        // create a thunk curried with test input values
        const testThunk = markAttendance({
          customerId,
          slotId: observedSlotId,
          attendedInterval,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(...thunkArgs);
        // booked should be null (since customer didn't book beforehand, but did attend)
        const expectedDoc = createDocumentWithObservedAttendance({
          [customerId]: { bookedInterval: null, attendedInterval },
        });
        // check updated db
        const docRef = firestore.doc(db, attendaceCollectionPath, slotId);
        const resData = (await firestore.getDoc(docRef)).data();
        expect(resData).toEqual(expectedDoc);
      }
    );

    testWithEmulator(
      "should enqueue error snackbar if update not successful",
      async () => {
        // cause synthetic error in execution
        jest.spyOn(firestore, "getFirestore").mockImplementationOnce(() => {
          throw new Error();
        });
        const initialDoc = createDocumentWithObservedAttendance({});
        const thunkArgs = await setupTestAttendance({
          attendance: { [slotId]: initialDoc },
          dispatch: mockDispatch,
        });
        const testThunk = markAttendance({
          customerId,
          slotId: observedSlotId,
          attendedInterval,
        });
        await testThunk(...thunkArgs);
        expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
      }
    );
  });

  describe("markAbsence ->", () => {
    testWithEmulator(
      "should mark customers attended interval as 'null' if customer booked beforehand (and not overwrite the rest of the data for given document in the process)",
      async () => {
        const initialDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval, bookedInterval },
        });
        // set up initial state
        const thunkArgs = await setupTestAttendance({
          attendance: { [slotId]: initialDoc },
        });
        // create a thunk curried with test input values
        const testThunk = markAbsence({
          customerId,
          slotId: observedSlotId,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(...thunkArgs);
        const expectedDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval: null, bookedInterval },
        });
        // check updated db
        const docRef = firestore.doc(db, attendaceCollectionPath, slotId);
        const resData = (await firestore.getDoc(docRef)).data();
        expect(resData).toEqual(expectedDoc);
      }
    );

    testWithEmulator(
      "should remove customer from attendance record for slot if customer didn't book (and is marked absent)",
      async () => {
        const initialDoc = createDocumentWithObservedAttendance({
          [customerId]: { attendedInterval, bookedInterval: null },
        });
        // set up initial state
        const thunkArgs = await setupTestAttendance({
          attendance: { [slotId]: initialDoc },
        });
        // create a thunk curried with test input values
        const testThunk = markAbsence({
          customerId,
          slotId: observedSlotId,
        });
        // test updating of the db using created thunk and middleware args from stores' setup
        await testThunk(...thunkArgs);
        // the customer should be removed (only the rest of the test data should be in the doc)
        const expectedDoc = createDocumentWithObservedAttendance({});
        // check updated db
        const docRef = firestore.doc(db, attendaceCollectionPath, slotId);
        const resData = (await firestore.getDoc(docRef)).data();
        expect(resData).toEqual(expectedDoc);
      }
    );

    testWithEmulator(
      "should enqueue error snackbar if update not successful",
      async () => {
        // cause synthetic error in execution
        jest.spyOn(firestore, "getFirestore").mockImplementationOnce(() => {
          throw new Error();
        });
        const initialDoc = createDocumentWithObservedAttendance({});
        const thunkArgs = await setupTestAttendance({
          attendance: { [slotId]: initialDoc },
          dispatch: mockDispatch,
        });
        const testThunk = markAbsence({
          customerId,
          slotId: observedSlotId,
        });
        await testThunk(...thunkArgs);
        expect(mockDispatch).toHaveBeenCalledWith(errNotifAction);
      }
    );
  });
});
