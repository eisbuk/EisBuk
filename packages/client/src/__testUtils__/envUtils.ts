import { test, TestAPI } from "vitest";

/**
 * A boolean flag set to `true` if the emulators exist in current environment
 */
export const __withEmulators__ = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

/**
 * A test util which serves as a wrapper around test closure.
 * Runs test provided if firestore emulator fired up.
 * Skips test provided (runs `xtest`) if no firestore emulator found
 * @param testArgs paramaters of `test` function
 */
export const testWithEmulator = (...args: Parameters<TestAPI>) => {
  // We set retry to 3 if not specified by our caller
  if (args.length > 2 && typeof args[2] === "object" && args[2] !== null) {
    if (!("retry" in args[2])) {
      args[2].retry = 3;
    }
  } else {
    args.push({ retry: 3 });
  }

  if (__withEmulators__) {
    test(...args);
  } else {
    test.skip(...args);
  }
};
