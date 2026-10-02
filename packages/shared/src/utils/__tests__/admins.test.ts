import { describe, test, expect } from "vitest";

import { normalizeAdminEntry } from "../admins";

describe("Admin utils", () => {
  describe("normalizeAdminEntry", () => {
    test("should trim whitespace around emails", () => {
      expect(normalizeAdminEntry(" beatrice@example.com ")).toBe(
        "beatrice@example.com",
      );
      expect(normalizeAdminEntry("\tbeatrice@example.com\n")).toBe(
        "beatrice@example.com",
      );
    });

    test("should leave valid emails and phone numbers unchanged", () => {
      expect(normalizeAdminEntry("beatrice@example.com", "+39")).toBe(
        "beatrice@example.com",
      );
      expect(normalizeAdminEntry("+393331234567", "+39")).toBe("+393331234567");
    });

    test("should prepend the default country code to phone numbers without a dial code", () => {
      expect(normalizeAdminEntry("3331234567", "+39")).toBe("+393331234567");
    });

    test("should not prepend anything if there's no default country code", () => {
      expect(normalizeAdminEntry("3331234567")).toBe("3331234567");
    });

    test("should replace a leading '00' with '+'", () => {
      expect(normalizeAdminEntry("00393331234567", "+39")).toBe(
        "+393331234567",
      );
    });

    test("should strip spaces and separators from phone numbers", () => {
      expect(normalizeAdminEntry(" +39 333 123 4567 ", "+39")).toBe(
        "+393331234567",
      );
      expect(normalizeAdminEntry("333-123.45/67", "+39")).toBe("+393331234567");
      expect(normalizeAdminEntry("(333) 123 4567", "+39")).toBe(
        "+393331234567",
      );
    });
  });
});
