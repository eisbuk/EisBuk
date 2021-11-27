/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import { Category, SlotType } from "eisbuk-shared";

import { PrivateRoutes } from "@/enums/routes";

describe("Create slot", () => {
  beforeEach(() => {
    cy.initAdminApp();
    cy.visit(PrivateRoutes.Root);

    cy.getAttrWith("aria-label", "Page Navigation").as("Page-Nav");

    cy.get("@Page-Nav").within(() => {
      cy.getAttrWith("href", PrivateRoutes.Root)
        .should("have.attr", "aria-disabled", "true")
        .and("have.attr", "aria-current", "page");

      cy.getAttrWith("href", PrivateRoutes.Slots)
        .should("have.attr", "aria-disabled", "false")
        .and("have.attr", "aria-current", "false");

      cy.getAttrWith("href", PrivateRoutes.Athletes)
        .should("have.attr", "aria-disabled", "false")
        .and("have.attr", "aria-current", "false");
    });

    cy.getAttrWith("href", PrivateRoutes.Slots).click();

    cy.getAttrWith(
      "aria-label",
      "Toggle visibility of slot operation buttons."
    ).as("Slot-Operation-Toggle");
  });

  it("fills in slot form and submits it", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.getAttrWith("aria-label", "Create new slots on", false).eq(0).click();

    cy.getAttrWith("aria-label", SlotType.Ice).click();
    cy.getAttrWith("aria-label", Category.Competitive).click();

    cy.getAttrWith("aria-label", "intervals[0] start time")
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", "intervals[0] end time").clear().type("10:30");

    cy.getAttrWith("aria-label", "Additional slot notes").type("some notes");
    cy.getAttrWith("aria-label", "Confirm slot creation").click();

    /** @TODO check for created slot or snackbar */

    /** @TODO tst for disabled checkbox */
  });

  it("creates an off-ice slot", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.getAttrWith("aria-label", "Create new slots on", false).eq(0).click();

    cy.getAttrWith("aria-label", SlotType.OffIceDancing).click();

    cy.getAttrWith("aria-label", "Slot Category").should(
      "have.attr",
      "aria-disabled",
      "true"
    );

    cy.getAttrWith("aria-label", "intervals[0] start time")
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", "intervals[0] end time").clear().type("10:30");
    cy.getAttrWith("aria-label", "Additional slot notes").type("some notes");
    cy.getAttrWith("aria-label", "Confirm slot creation").click();
  });

  it("creates a multi-interval slot", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.getAttrWith("aria-label", "Create new slots on", false).eq(0).click();

    cy.getAttrWith("aria-label", SlotType.Ice).click();
    cy.getAttrWith("aria-label", Category.Competitive).click();

    cy.getAttrWith("aria-label", "intervals[0] start time")
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", "intervals[0] end time").clear().type("10:30");

    cy.getAttrWith("aria-label", "Add Interval").click();

    cy.getAttrWith("aria-label", "intervals[1] start time")
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", "intervals[1] end time").clear().type("10:30");

    cy.getAttrWith("aria-label", "Additional slot notes").type("some notes");
    cy.getAttrWith("aria-label", "Confirm slot creation").click();
  });

  it("shows 'invalid time format' validation error", () => {
    cy.visit(PrivateRoutes.Slots);
    cy.getAttrWith("type", "checkbox").click();
    cy.getAttrWith("data-testid", "new-slot-button").first().click();
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).check();

    cy.getAttrWith("type", "text").eq(0).clear().type("9");
    cy.getAttrWith("type", "text").eq(1).clear().type("10 pm");

    cy.getAttrWith("type", "submit").click();
    cy.contains("Invalid time format");
  });
  it("shows validation error for inconsistent period start/end", () => {
    cy.visit(PrivateRoutes.Slots);
    cy.getAttrWith("type", "checkbox").click();
    cy.getAttrWith("data-testid", "new-slot-button").first().click();
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).check();

    cy.getAttrWith("type", "text").eq(0).clear().type("9:00");
    cy.getAttrWith("type", "text").eq(1).clear().type("7:00");

    cy.getAttrWith("type", "submit").click();
    // The dialog is still there
    cy.getAttrWith("role", "dialog").within(() => {
      // and it contains this error message
      cy.contains("Start time is greater than end time");
    });
  });
});
