/**
 * @vitest-environment node
 */

import { User } from "@firebase/auth";
import { describe, vi, expect, test, afterEach } from "vitest";

import { defaultUser } from "@eisbuk/testing/envData";

import { updateAuthUser } from "../authOperations";

import { getNewStore } from "@/store/createStore";
import { runThunk } from "@/__testUtils__/helpers";

// a minimalist dummy entry for a user
const testUser: User = { uid: "some uuid", email: defaultUser.email } as User;

const mockQueryAuthStatus = vi.fn();
// mock the entire functions package as we're only using `httpsCallable`
vi.mock("@firebase/functions", async () => {
  const functions = (await vi.importActual("@firebase/functions")) as object;
  return {
    ...functions,
    // httpsCallable will always return mockQueryAuthStatus as `queryAuthStatus`
    // is the only usage of `httpsCallable` in `authOperations` package
    httpsCallable: () => mockQueryAuthStatus,
  };
});

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
      await runThunk(testThunk, dispatch, getState);
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
          secretKeys: ["secret-key"],
        },
      });
      await runThunk(testThunk, dispatch, getState);
      expect(getState().auth).toEqual({
        isAdmin: false,
        isEmpty: false,
        isLoaded: true,
        userData: testUser,
        secretKeys: ["secret-key"],
      });
      // try with admin user
      mockQueryAuthStatus.mockResolvedValueOnce({ data: { isAdmin: true } });
      await runThunk(testThunk, dispatch, getState);
      expect(getState().auth).toEqual({
        userData: testUser,
        isAdmin: true,
        isEmpty: false,
        isLoaded: true,
      });
    });

    test("should not hang the app if the auth-status callable rejects (regression: #960 / unhandled rejection)", async () => {
      const { dispatch, getState } = getNewStore();
      const testThunk = updateAuthUser(testUser);

      // Simulate the callable failing (network blip / cold-start timeout / 5xx)
      mockQueryAuthStatus.mockRejectedValueOnce(
        new Error("internal: callable failed"),
      );

      // The thunk must resolve (not reject) ...
      await expect(
        runThunk(testThunk, dispatch, getState),
      ).resolves.not.toThrow();

      // ... and the auth state must be marked loaded so the UI stops hanging,
      // with the user authenticated but not (wrongly) granted admin/secret access.
      expect(getState().auth).toEqual({
        isAdmin: false,
        secretKeys: [],
        isEmpty: false,
        isLoaded: true,
        userData: testUser,
      });
    });

    test("should reset the state (perform local logout) if no user is received", async () => {
      // set up tests with authenticated admin
      const { dispatch, getState } = getNewStore();
      mockQueryAuthStatus.mockResolvedValueOnce({ data: { isAdmin: true } });
      let testThunk = updateAuthUser(testUser);
      await runThunk(testThunk, dispatch, getState);
      // run the thunk
      testThunk = updateAuthUser(null);
      await runThunk(testThunk, dispatch, getState);
      expect(getState().auth).toEqual({
        userData: null,
        isAdmin: false,
        isEmpty: true,
        isLoaded: true,
      });
    });
  });
});
