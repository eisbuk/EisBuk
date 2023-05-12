import { expect, afterEach } from "vitest";

import jestDomMatchers, {
  type TestingLibraryMatchers,
} from "@testing-library/jest-dom/matchers";
import { matchers as jestSmtpMatchers } from "jest-smtp";

import { cleanup } from "@testing-library/react";

// Required to appease TS
// Merges standard matchers declaration with js-dom extensions
declare global {
  namespace Vi {
    interface JestAssertion<T = any>
      extends jest.Matchers<void, T>,
        TestingLibraryMatchers<T, void> {}
  }
}

// Add custom jest DOM matchers
expect.extend(jestDomMatchers);
// Add custom jest-smtp matchers
expect.extend(jestSmtpMatchers);

afterEach(cleanup);
