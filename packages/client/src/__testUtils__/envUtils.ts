import { test, TestFunction } from "vitest";

type TestClosure = (name: string, fn?: TestFunction, timeout?: number) => void;

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
export const testWithEmulator: TestClosure = (...args) => {
  if (__withEmulators__) {
    test(...args);
  } else {
    test.skip(...args);
  }
};
