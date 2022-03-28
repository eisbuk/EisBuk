import { DateTime } from "luxon";
import { PrivateRoutes, Routes } from "@/enums/routes";
import { gus } from "@/__testData__/customers";
import {
  __currentDateId__,
  __DayWithBookedSlots__,
  __DayWithSlots__,
} from "@/__testData__/testIds";

describe("Date Switcher", () => {
  describe("Badges", () => {
    beforeEach(() => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);

      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, [
          "bookings.json",
          "slots.json",
          "customers.json",
          "attendance.json",
        ])
      );

      cy.signIn();
    });
    it("should show badges on days with empty slots in attendance view", () => {
      cy.visit(PrivateRoutes.Root);
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __DayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2021-12-31").toFormat("DD"));
    });
    it("should show badges on days with empty slots in customer calendar view", () => {
      cy.visit([Routes.CustomerArea, gus.secretKey, "calendar"].join("/"));
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __DayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2021-12-31").toFormat("DD"));
    });
    it("should show badges on days with booked slots in customer calendar view", () => {
      cy.visit([Routes.CustomerArea, gus.secretKey, "calendar"].join("/"));
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __DayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));
    });
    it("should show badges on days with booked slots in attendance view", () => {
      cy.visit(PrivateRoutes.Root);
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __DayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));
    });
  });
});
