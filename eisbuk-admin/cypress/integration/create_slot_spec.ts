/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import i18n from "@/__testUtils__/i18n";

import { Category, SlotType } from "eisbuk-shared";

import { PrivateRoutes } from "@/enums/routes";
import { AdminAria, SlotFormAria } from "@/enums/translations";

const t = i18n.t;

const createSlotSpec = (config = { isMobile: false }) => {
  beforeEach(() => {
    cy.initAdminApp();
    cy.visit(PrivateRoutes.Root);
    cy.getAttrWith("aria-label", t(AdminAria.PageNav)).as("Page-Nav");
    if (config.isMobile) {
      cy.get("@Page-Nav").click();
    } else {
      cy.get("@Page-Nav").within(() => {
        // TODO we should not be doing assertions in a beforeEach
        // function. These assertions should be moved to their own
        // test, maybe called "navigation".
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
    }
    cy.getAttrWith("href", PrivateRoutes.Slots).click();

    cy.getAttrWith("aria-label", t(AdminAria.ToggleSlotOperations)).as(
      "Slot-Operation-Toggle"
    );
  });

  it("fills in slot form and submits it", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.getAttrWith("aria-label", t(AdminAria.CreateSlots), false).eq(0).click();

    cy.getAttrWith("aria-label", SlotType.Ice).click();
    cy.getAttrWith("aria-label", Category.Competitive).click();

    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalStart))
      .eq(0)
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalEnd))
      .eq(0)
      .clear()
      .type("10:30");

    cy.getAttrWith("aria-label", t(SlotFormAria.SlotNotes)).type("some notes");
    cy.getAttrWith("aria-label", t(SlotFormAria.ConfirmCreateSlot)).click();

    /** @TODO check for created slot or snackbar */

    /** @TODO tst for disabled checkbox */
  });

  it("creates an off-ice slot", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.getAttrWith("aria-label", t(AdminAria.CreateSlots), false).eq(0).click();

    cy.getAttrWith("aria-label", SlotType.OffIceDancing).click();

    cy.getAttrWith("aria-label", t(SlotFormAria.SlotCategory)).should(
      "have.attr",
      "aria-disabled",
      "true"
    );

    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalStart))
      .eq(0)
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalEnd))
      .eq(0)
      .clear()
      .type("10:30");
    cy.getAttrWith("aria-label", t(SlotFormAria.SlotNotes)).type("some notes");
    cy.getAttrWith("aria-label", t(SlotFormAria.ConfirmCreateSlot)).click();
  });

  it("creates a multi-interval slot", () => {
    cy.get("@Slot-Operation-Toggle").click();
    cy.getAttrWith("aria-label", t(AdminAria.CreateSlots), false).eq(0).click();

    cy.getAttrWith("aria-label", SlotType.Ice).click();
    cy.getAttrWith("aria-label", Category.Competitive).click();

    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalStart))
      .eq(0)
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalEnd))
      .eq(0)
      .clear()
      .type("10:30");

    cy.getAttrWith("aria-label", t(SlotFormAria.AddInterval)).click();

    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalStart))
      .eq(1)
      .clear()
      .type("09:00");
    cy.getAttrWith("aria-label", t(SlotFormAria.IntervalEnd))
      .eq(1)
      .clear()
      .type("10:30");

    cy.getAttrWith("aria-label", t(SlotFormAria.SlotNotes)).type("some notes");
    cy.getAttrWith("aria-label", t(SlotFormAria.ConfirmCreateSlot)).click();
  });

  it("shows 'invalid time format' validation error", () => {
    cy.visit(PrivateRoutes.Slots);
    cy.getAttrWith("type", "checkbox").click();
    cy.getAttrWith("aria-label", t(AdminAria.CreateSlots), false).eq(0).click();
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).check();

    cy.getAttrWith("type", "text").eq(0).clear().type("9");
    cy.getAttrWith("type", "text").eq(1).clear().type("10 pm");

    cy.getAttrWith("aria-label", t(SlotFormAria.ConfirmCreateSlot)).click();
    cy.getAttrWith("role", "dialog").contains("Invalid time format");
  });

  it("shows validation error for inconsistent period start/end", () => {
    cy.getAttrWith("type", "checkbox").click();
    cy.getAttrWith("aria-label", t(AdminAria.CreateSlots), false).eq(0).click();
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).check();

    cy.getAttrWith("type", "text").eq(0).clear().type("9:00");
    cy.getAttrWith("type", "text").eq(1).clear().type("7:00");

    cy.getAttrWith("aria-label", t(SlotFormAria.ConfirmCreateSlot)).click();
    cy.getAttrWith("role", "dialog").contains(
      "Start time is greater than end time"
    );
  });
};

const iphoneSe2 = {
  viewportHeight: 667,
  viewportWidth: 375,
};

describe("Create slot (mobile)", iphoneSe2, () =>
  createSlotSpec({ isMobile: true })
);
describe("Create slot (desktop)", createSlotSpec);
