import { Category, SlotType } from "@eisbuk/shared";
import i18n, { SlotsAria, SlotFormAria } from "@eisbuk/translations";
import { DateTime } from "luxon";

import { PrivateRoutes } from "../temp";

import { __testDate__ } from "../constants";

const t = i18n.t;

const createSlotSpec = () => {
  beforeEach(() => {
    cy.initAdminApp();
    cy.signIn();
    cy.visit(PrivateRoutes.Slots);

    cy.getAttrWith("aria-label", t(SlotsAria.EnableEdit)).click();
    cy.getAttrWith(
      "aria-label",
      t(SlotsAria.CreateSlot, { date: DateTime.fromISO(__testDate__) }),
      false
    )
      .eq(0)
      // we're doing force: true here since the button isn't visible
      // due to cypress' weird scrolling behaviour
      .click({ force: true });
  });

  it("fills in slot form and submits it", () => {
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
    cy.getAttrWith("aria-label", SlotType.OffIce).click();

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
    cy.getAttrWith("value", SlotType.Ice).check();
    cy.getAttrWith("value", Category.Competitive).check();

    cy.getAttrWith("type", "text").eq(0).clear().type("9");
    cy.getAttrWith("type", "text").eq(1).clear().type("10 pm");

    cy.getAttrWith("aria-label", t(SlotFormAria.ConfirmCreateSlot)).click();
    cy.getAttrWith("role", "dialog").contains("Invalid time format");
  });

  it("shows validation error for inconsistent period start/end", () => {
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

describe("Create slot (mobile)", iphoneSe2, createSlotSpec);
describe("Create slot (desktop)", createSlotSpec);
