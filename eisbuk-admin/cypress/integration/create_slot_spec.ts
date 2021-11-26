/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import { Category, SlotType } from "eisbuk-shared";

import { PrivateRoutes } from "@/enums/routes";

describe("Create slot", () => {
  beforeEach(() => {
    cy.initAdminApp();
    cy.visit(PrivateRoutes.Root);

    cy.get("div[aria-label='Page Navigation']").as("Page-Nav");

    cy.get("@Page-Nav").within(() => {
      cy.get(`a[href='${PrivateRoutes.Root}']`)
        .should("have.attr", "aria-disabled", "true")
        .and("have.attr", "aria-current", "page");

      cy.get(`a[href='${PrivateRoutes.Slots}']`)
        .should("have.attr", "aria-disabled", "false")
        .and("have.attr", "aria-current", "false");

      cy.get(`a[href='${PrivateRoutes.Athletes}']`)
        .should("have.attr", "aria-disabled", "false")
        .and("have.attr", "aria-current", "false");
    });

    cy.get(`a[href='${PrivateRoutes.Slots}']`).click();

    cy.get("[aria-label='Toggle visibility of slot operation buttons.']").as(
      "Slot-Operation-Toggle"
    );
  });

  it("fills in slot form and submits it", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.get("[aria-label='Create new slots button']").eq(0).click();

    cy.get(`[aria-label='${SlotType.Ice}']`).click();
    cy.get(`[aria-label='${Category.Competitive}']`).click();

    cy.get("[aria-label='intervals[0] start time']").clear().type("09:00");
    cy.get("[aria-label='intervals[0] end time']").clear().type("10:30");

    cy.get("[aria-label='Additional slot notes']").type("some notes");
    cy.get("[aria-label='Confirm slot creation']").click();

    /** @TODO check for created slot or snackbar */

    /** @TODO tst for disabled checkbox */
  });

  it("creates an off-ice slot", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.get("[aria-label='Create new slots button']").eq(0).click();

    cy.get(`[aria-label='${SlotType.OffIceDancing}']`).click();

    cy.get("[aria-label='Slot Category']").should(
      "have.attr",
      "aria-disabled",
      "true"
    );

    cy.get("[aria-label='intervals[0] start time']").clear().type("09:00");
    cy.get("[aria-label='intervals[0] end time']").clear().type("10:30");
    cy.get("[aria-label='Additional slot notes']").type("some notes");
    cy.get("[aria-label='Confirm slot creation']").click();
  });

  it("creates a multi-interval slot", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.get("[aria-label='Create new slots button']").eq(0).click();

    cy.get(`[aria-label='${SlotType.Ice}']`).click();
    cy.get(`[aria-label='${Category.Competitive}']`).click();

    cy.get("[aria-label='intervals[0] start time']").clear().type("09:00");
    cy.get("[aria-label='intervals[0] end time']").clear().type("10:30");

    cy.get("[aria-label='Add Interval']").click();

    cy.get("[aria-label='intervals[1] start time']").clear().type("09:00");
    cy.get("[aria-label='intervals[1] end time']").clear().type("10:30");

    cy.get("[aria-label='Additional slot notes']").type("some notes");
    cy.get("[aria-label='Confirm slot creation']").click();
  });

  it("shows 'invalid time format' validation error", () => {
    cy.visit(PrivateRoutes.Slots);
    cy.get("[type='checkbox']").click();
    cy.get("[data-testid='new-slot-button']").first().click();
    cy.get(`[value='${SlotType.Ice}']`).check();
    cy.get(`[value='${Category.Competitive}']`).check();

    cy.get("[type='text']").eq(0).clear().type("9");
    cy.get("[type='text']").eq(1).clear().type("10 pm");

    cy.get("[type='submit']").click();
    cy.contains("Invalid time format");
  });
  it("shows validation error for inconsistent period start/end", () => {
    cy.visit(PrivateRoutes.Slots);
    cy.get("[type='checkbox']").click();
    cy.get("[data-testid='new-slot-button']").first().click();
    cy.get(`[value='${SlotType.Ice}']`).check();
    cy.get(`[value='${Category.Competitive}']`).check();

    cy.get("[type='text']").eq(0).clear().type("9:00");
    cy.get("[type='text']").eq(1).clear().type("7:00");

    cy.get("[type='submit']").click();
    // The dialog is still there
    cy.get("[role='dialog'").within(() => {
      // and it contains this error message
      cy.contains("Start time is greater than end time");
    });
  });
});
