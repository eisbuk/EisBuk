import { interpolateText } from "../text";

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
  });
});
