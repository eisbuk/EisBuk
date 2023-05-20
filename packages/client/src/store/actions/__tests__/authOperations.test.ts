/**
 * @vitest-environment node
 */

import { User } from "@firebase/auth";
import { describe, vi, expect, test, afterEach } from "vitest";

import { defaultUser } from "@eisbuk/testing/envData";

import { updateAuthUser } from "../authOperations";

import { getNewStore } from "@/store/createStore";

// a minimalist dummy entry for a user
const testUser: User = { uid: "some uuid", email: defaultUser.email } as User;

const mockQueryAuthStatus = vi.fn();
// mock the entire functions package as we're only using `httpsCallable`
vi.mock("@firebase/functions", () => ({
  getFunctions: vi.fn(),
  // httpsCallable will always return mockQueryAuthStatus as `queryAuthStatus`
  // is the only usage of `httpsCallable` in `authOperations` package
  httpsCallable: () => mockQueryAuthStatus,
}));
vi.mock("@firebase/app", () => ({
  ...vi.importActual("@firebase/app"),
  getApp: vi.fn(),
}));

const dummyGetFirestore = () => ({} as any);

describe("Auth operations", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("test updating auth state on user changed", () => {
    test("should update user auth state to local store", async () => {
      const { dispatch, getState } = getNewStore();
      const testThunk = updateAuthUser(testUser);
      // try with user authenticated, but not admin nor customer
      mockQueryAuthStatus.mockResolvedValueOnce({
        data: {
          isAdmin: false,
        },
      });
      await testThunk(dispatch, getState, { getFirestore: dummyGetFirestore });
      expect(getState().auth).toEqual({
        isAdmin: false,
        isEmpty: false,
        isLoaded: true,
        userData: testUser,
      });
      // try with customer user
      mockQueryAuthStatus.mockResolvedValueOnce({
        data: {
          isAdmin: false,
          bookingsSecretKey: "secret-key",
        },
      });
      await testThunk(dispatch, getState, { getFirestore: dummyGetFirestore });
      expect(getState().auth).toEqual({
        isAdmin: false,
        isEmpty: false,
        isLoaded: true,
        userData: testUser,
        bookingsSecretKey: "secret-key",
      });
      // try with admin user
      mockQueryAuthStatus.mockResolvedValueOnce({ data: { isAdmin: true } });
      await testThunk(dispatch, getState, { getFirestore: dummyGetFirestore });
      expect(getState().auth).toEqual({
        userData: testUser,
        isAdmin: true,
        isEmpty: false,
        isLoaded: true,
      });
    });

    test("should reset the state (perform local logout) if no user is received", async () => {
      // set up tests with authenticated admin
      const { dispatch, getState } = getNewStore();
      mockQueryAuthStatus.mockResolvedValueOnce({ data: { isAdmin: true } });
      await updateAuthUser(testUser)(dispatch, getState, {
        getFirestore: dummyGetFirestore,
      });
      // run the thunk
      const testThunk = updateAuthUser(null);
      await testThunk(dispatch, getState, { getFirestore: dummyGetFirestore });
      expect(getState().auth).toEqual({
        userData: null,
        isAdmin: false,
        isEmpty: true,
        isLoaded: true,
      });
    });
  });
});
