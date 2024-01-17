import { describe, test, expect } from "vitest";

import { interpolateText, checkExpected } from "../text";

describe("Text utils", () => {
  describe("interpolateText", () => {
    test("should interploate all occurrences of all supported placeholders", () => {
      const template =
        "Ciao {{ name }} {{ surname }}, your name is {{ name }}, and your surname is {{ surname }}";
      const interpolatedHtml = interpolateText(template, {
        name: "Saul",
        surname: "Goodman",
      });
      expect(interpolatedHtml).toBe(
        "Ciao Saul Goodman, your name is Saul, and your surname is Goodman"
      );
    });

    test("should interpolate placeholder surrounded by {{  }} with spaces in a string into their equivalent values", () => {
      const template = "Ciao {{ name    }}"; // Number of spaces should not matter
      const interpolatedHtml = interpolateText(template, {
        name: "Saul",
      });
      expect(interpolatedHtml).toBe("Ciao Saul");
    });

    test("should interpolate placeholders surrounded by {{}} without spaces in a string into their equivalent values", () => {
      const template = "Ciao {{name}}";
      const interpolatedHtml = interpolateText(template, {
        name: "Saul",
      });
      expect(interpolatedHtml).toBe("Ciao Saul");
    });

    test("should not show a placeholder if no value was provided for a given placeholder", () => {
      const template = "Ciao {{ name }}";
      const interpolatedHtml = interpolateText(template, {});
      expect(interpolatedHtml).toBe("Ciao");
    });

    test("Should ignore whitespace differences in registration code", async () => {
      const cases = [
        ["A string", "A string!"],
        ["Look, ma, some spaces!", "LOOKMASOMESPACES"],
        ["Let's try with apostrophes", "Let s try with apostrophes."],
        ["On the others side", "On the other's side"],
        [
          "Nobody: use punctuation; You: expect it",
          "Nobody? USE punctuation! You, expect it!",
        ],
      ];
      for (const [input, expected] of cases) {
        const result = checkExpected(input, expected);
        if (!result) {
          console.log("input", input);
          console.log("expected", expected);
        }
        expect(result).toEqual(true);
      }
    });

    test("Should fail when strings are different", async () => {
      const cases = [
        ["A string", "A string! You see?"],
        ["Look, ma, some spaces!", "LOOKMANOSPACES"],
      ];
      for (const [input, expected] of cases) {
        const result = checkExpected(input, expected);
        if (result) {
          console.log("input", input);
          console.log("expected", expected);
        }
        expect(result).toEqual(false);
      }
    });
  });
});
