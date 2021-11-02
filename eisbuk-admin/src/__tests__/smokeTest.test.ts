import i18n from "i18next";
import "@/i18next/i18n";

import { ActionButton } from "@/enums/translations";

describe("Smoke test", () => {
  test("should initialize i18n with the tests", () => {
    const translatedString = i18n.t(ActionButton.Cancel);
    expect(translatedString).toEqual("Cancel");
  });
});
