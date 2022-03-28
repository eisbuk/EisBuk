import { DateTime } from "luxon";
import { PrivateRoutes, Routes } from "@/enums/routes";
import { saul } from "@/__testData__/customers";
import {
  __currentDateId__,
  __customerNavigationCalendar__,
  __dateNavPrevId__,
  __DayWithBookedSlots__,
  __DayWithSlots__,
} from "@/__testData__/testIds";

describe("Date Switcher", () => {
  describe("Badges", () => {
    beforeEach(() => {
      // our test data starts with this date so we're using it as reference point
      const testDate = "2022-01-01";
      const testDateLuxon = DateTime.fromISO(testDate);

      // set current time just after the deadline has passed
      cy.setClock(testDateLuxon.toMillis());
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, [
          "bookings.json",
          "slots.json",
          "saul_with_extended_date.json",
        ])
      );

      cy.signIn();
    });
    it("should show badges on days with booked slots in attendance view", () => {
      cy.initAdminApp().then((organization) =>
        cy.updateFirestore(organization, ["attendance.json"])
      );

      cy.signIn();
      cy.visit(PrivateRoutes.Root);
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __DayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-02").toFormat("DD"));
    });
    it("should show badges on days with empty slots in attendance view", () => {
      cy.visit(PrivateRoutes.Root);
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __DayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));
    });
    it("should show badges on days with empty slots in customer calendar view", () => {
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      cy.getAttrWith("data-testid", __customerNavigationCalendar__).click();
      cy.getAttrWith("data-testid", __dateNavPrevId__).click();
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __DayWithSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-01").toFormat("DD"));
    });
    it("should show badges on days with booked slots in customer calendar view", () => {
      cy.visit([Routes.CustomerArea, saul.secretKey].join("/"));
      cy.getAttrWith("data-testid", __customerNavigationCalendar__).click();
      cy.getAttrWith("data-testid", __dateNavPrevId__).click();
      cy.getAttrWith("data-testid", __currentDateId__).click();
      cy.getAttrWith("data-testid", __DayWithBookedSlots__)
        .children()
        .eq(0)
        .should("have.attr", "aria-label")
        .and("equal", DateTime.fromISO("2022-01-02").toFormat("DD"));
    });
  });
});
