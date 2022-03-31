import { DateTime } from "luxon";
import { PrivateRoutes, Routes } from "@/enums/routes";
import { gus } from "@/__testData__/customers";
import {
  __currentDateId__,
  __dateNavNextId__,
  __dayWithBookedSlots__,
  __dayWithSlots__,
} from "@/__testData__/testIds";

describe("Date Switcher", () => {
  describe("Customer calendar view", () => {
    beforeEach(() => {
      const testDateLuxon = DateTime.fromISO("2022-01-04");

      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp().then((organization) =>
        cy
          .updateFirestore(organization, ["slots.json", "bookings.json"])
          .then(() => cy.signIn())
      );
    });

    it("should show badges on days with empty slots in customer calendar view", () => {
      cy.visit([Routes.CustomerArea, gus.secretKey, "calendar"].join("/"));
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __dayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-02").toFormat("DD"));
    });
    it("should show badges on days with booked slots in customer calendar view", () => {
      cy.visit([Routes.CustomerArea, gus.secretKey, "calendar"].join("/"));
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __dayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));
    });
  });
  describe("Attendance view", () => {
    beforeEach(() => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-04";
      const testDateLuxon = DateTime.fromISO(testDate);

      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp().then((organization) =>
        cy
          .updateFirestore(organization, ["attendance.json"])
          .then(() => cy.signIn())
      );

      // cy.signIn();
    });

    it("should show badges on days with booked slots in attendance view", () => {
      cy.visit(PrivateRoutes.Root);
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __dayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));
    });
    it("should show badges on days with empty slots in attendance view", () => {
      cy.visit(PrivateRoutes.Root);
      cy.getAttrWith("data-testid", __dateNavNextId__);
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __dayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-02").toFormat("DD"));
    });
  });
});
