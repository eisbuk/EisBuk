import { User } from "@firebase/auth";

import { Collection, OrganizationData } from "eisbuk-shared";

import { defaultUser } from "@/__testSetup__/envData";

import { __organization__ } from "@/lib/constants";

import { Action } from "@/enums/store";

import { revalidateAdminStatus, updateAuthUser } from "../authOperations";
import { updateLocalColl } from "@/store/firestore/actions/actionCreators";

import { getNewStore } from "@/store/createStore";

// a minimalist dummy entry for a user
const testUser: User = { uid: "some uuid", email: defaultUser.email } as User;

/**
 * A store we'll be using throughout the tests,
 * gets restarted before each test
 */
let testStore = getNewStore();

describe("Auth operations", () => {
  beforeEach(() => {
    // restart the store to default state,
    // with test organization added to the store
    testStore = getNewStore();
    const { dispatch } = testStore;
    dispatch(
      updateLocalColl(Collection.Organizations, {
        [__organization__]: { admins: [defaultUser.email] } as OrganizationData,
      })
    );
  });

  describe("test updating auth state on user changed", () => {
    test("should update user to local store", async () => {
      const { dispatch, getState } = testStore;
      const testThunk = updateAuthUser(testUser);
      await testThunk(dispatch, getState);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userData, isLoaded } = getState().auth;
      expect(userData).toEqual(testUser);
      expect(isLoaded).toEqual(true);
    });

    test("should update isAdmin flag if user is an admin of current organization", async () => {
      const { dispatch, getState } = testStore;
      const testThunk = updateAuthUser(testUser);
      await testThunk(dispatch, getState);
      const { isAdmin, isEmpty, isLoaded } = getState().auth;
      expect(isAdmin).toEqual(true);
      expect(isEmpty).toEqual(false);
      expect(isLoaded).toEqual(true);
    });

    test("should reset the state (perform local logout) if no user is received", async () => {
      const { dispatch, getState } = testStore;
      await updateAuthUser(testUser)(dispatch, getState);
      // run the thunk
      const testThunk = updateAuthUser(null);
      await testThunk(dispatch, getState);
      const auth = getState().auth;
      expect(auth).toEqual({
        userData: null,
        isAdmin: false,
        isEmpty: true,
        isLoaded: true,
      });
    });

    test("should update 'userData' and set 'isEmpty' to false if user is registered in firebase auth, but not an admin of current organization", async () => {
      const { dispatch, getState } = testStore;
      const testThunk = updateAuthUser({
        ...testUser,
        email: "not-admmin@gmail.com",
      });
      await testThunk(dispatch, getState);
      const { isAdmin, isEmpty, isLoaded } = getState().auth;
      expect(isAdmin).toEqual(false);
      expect(isEmpty).toEqual(false);
      expect(isLoaded).toEqual(true);
    });
  });

  describe("test updating isAdmin on revalidation", () => {
    test("should get 'userData' and organizations data from store and update 'auth.isAdmin' if needed", async () => {
      const { dispatch, getState } = testStore;
      dispatch({
        type: Action.UpdateAuthInfo,
        payload: {
          userData: testUser,
          // remember here that the test user should be admin
          // because of `beforeEach`. Here we're explicitly setting it
          // to `false` to test manual revalidation
          isAdmin: false,
          isEmpty: false,
          isLoaded: true,
        },
      });
      await revalidateAdminStatus(dispatch, getState);
      const { isAdmin } = getState().auth;
      expect(isAdmin).toEqual(true);
    });

    test("should not dispatch enything if 'isAdmin' is as it should be", async () => {
      const { dispatch, getState } = testStore;
      dispatch({
        type: Action.UpdateAuthInfo,
        payload: {
          userData: testUser,
          // remember here that the test user should be admin
          // because of `beforeEach`. Here we're explicitly setting it
          // to `false` to test manual revalidation
          isAdmin: true,
          isEmpty: false,
          isLoaded: true,
        },
      });
      const mockDispatch = jest.fn();
      await revalidateAdminStatus(mockDispatch, getState);
      // is admin is already true (as it should be)
      // so mockDispatch shouldn't be called
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
