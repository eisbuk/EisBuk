import { describe, expect, test } from "vitest";
/**
 * @vitest-environment node
 */

import i18n, { ActionButton } from "@eisbuk/translations";

describe("Smoke test", () => {
  describe("Test i18n setup", () => {
    test("should initialize i18n with the tests", () => {
      // i18n should be initialized in imported `@eisbuk/translations`
      const translatedString = i18n.t(ActionButton.Cancel);
      expect(translatedString).toEqual("Cancel");
    });
  });
});
