import { test, expect, describe } from "vitest";
import { shortName } from "../helpers";

describe("Test helpers", () => {
  describe("Name shortening function", () => {
    test("should not shorten if there's only one name and one surname", () => {
      const name = "John";
      const surname = "Doe";
      expect(shortName(name, surname)).toEqual(["John", "Doe"]);
    });

    test("should not be thrown off it name has additional prepended, appended spaces", () => {
      expect(shortName("John ", "Doe ")).toEqual(["John", "Doe"]);
      expect(shortName(" John", " Doe")).toEqual(["John", "Doe"]);
    });

    test("should shorten the name and surname and return a string containing full first name and last name with all other names shortened", () => {
      const name = "John Ronald Reuel";
      const surname = "Tolkien";
      expect(shortName(name, surname)).toEqual(["John R. R.", "Tolkien"]);

      const name2 = "Thomas";
      const surname2 = "Tailor Thomas";
      expect(shortName(name2, surname2)).toEqual(["Thomas", "T. Thomas"]);
    });

    test("should leave the surname particles (common in a lot of languages) intact", () => {
      const name = "John";
      const surname = "de la Cruz";
      expect(shortName(name, surname)).toEqual(["John", "de la Cruz"]);

      const name2 = "Ludwig";
      const surname2 = "van Beethoven";
      expect(shortName(name2, surname2)).toEqual(["Ludwig", "van Beethoven"]);

      const name3 = "Robert";
      const surname3 = "De Niro";
      expect(shortName(name3, surname3)).toEqual(["Robert", "De Niro"]);
    });

    test("should shorten the last names even if there prepended with a particle", () => {
      const name = "Pablo Diego José Francisco";
      const surname =
        "de Paula Juan Nepomuceno María de los Remedios Cipriano de la Santísima Trinidad Ruiz y Picasso";
      expect(shortName(name, surname)).toEqual([
        "Pablo D. J. F.",
        "de P. J. N. M. de los R. C. de la S. T. R. y Picasso",
      ]);
    });
  });
});
