import { DateTime } from "luxon";
import i18n from "@/i18next/i18n";

import { Routes } from "@/enums/routes";
import { ActionButton } from "@/enums/translations";

import { createDateTitle } from "@/components/atoms/DateNavigation/utils";

import { saul } from "@/__testData__/customers";

describe("Booking flow", () => {
  describe("Test for not-an-admin", () => {
    it("should not allow booking past the booking deadline for a given month", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      // test booking the slot in regular circumstances (min 5 days before start of `testDate` month)
      const afterDueDate = testDateLuxon
        .minus({
          days: 5,
        })
        .plus({ hours: 1 });
      cy.setClock(afterDueDate.toMillis());
      cy.initAdminApp(false).then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
        "have.attr",
        "disabled"
      );
    });
  });

  describe("Test for admin", () => {
    it("should always allow booking, if admin", () => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);
      // test booking the slot in regular circumstances (min 5 days before start of `testDate` month)
      const afterDueDate = testDateLuxon
        .minus({
          days: 5,
        })
        .plus({ hours: 1 });
      cy.setClock(afterDueDate.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["customers.json", "slots.json"])
      );
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      // should open next month as starting value for `currentDate` (in store)
      // default timespan should be "month" as the default customer navigation position is "book_ice"
      cy.contains(createDateTitle(testDateLuxon, "month", i18n.t));
      cy.getAttrWith("aria-label", i18n.t(ActionButton.BookInterval)).should(
        "not.have.attr",
        "disabled"
      );
    });
  });
});
